package com.example.backend.service;

import com.example.backend.dto.DocArtifactResponse;
import com.example.backend.dto.DocGenerationJobResponse;
import com.example.backend.dto.DocWebhookRequest;
import com.example.backend.enums.DocArtifactStatus;
import com.example.backend.model.DocArtifact;
import com.example.backend.model.DocGenerationJob;
import com.example.backend.model.GithubCommitJob;
import com.example.backend.model.GithubRepository;
import com.example.backend.model.Job;
import com.example.backend.repository.DocArtifactRepository;
import com.example.backend.repository.DocGenerationJobRepository;
import com.example.backend.repository.GithubCommitJobRepository;
import com.example.backend.repository.GithubRepositoryRepository;
import com.example.backend.repository.JobRepository;
import com.example.backend.ai.PersistentChatMemoryStore;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.Result;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.backend.enums.JobStatus;
import com.example.backend.enums.JobType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class DocAgentService {

    private final DocGenerationJobRepository docJobRepository;
    private final DocArtifactRepository artifactRepository;
    private final GithubRepositoryRepository githubRepositoryRepository;
    private final GithubCommitJobRepository githubCommitJobRepository;
    private final JobRepository workspaceJobRepository;
    private final KnowledgeService knowledgeService;
    private final PersistentChatMemoryStore chatMemoryStore;
    private final GitHubAppService gitHubAppService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${github.repo.owner:}")
    private String githubRepoOwner;

    @Value("${github.repo.name:}")
    private String githubRepoName;

    @Value("${github.app.installation-id:}")
    private String githubInstallationId;

    interface DocAssistant {
        @SystemMessage("""
                You are Doc-Agent for Pulse.
                Generate a Markdown document that extends the previous documentation instead of replacing it blindly.
                Use the provided commit/PR context, changed files, diff summary, and previous documentation context.
                Be accurate and do not invent API endpoints, files, or architecture changes that are not supported by the input.
                Structure the output with these sections when relevant:
                Overview
                What Changed
                Impacted Areas
                API Changes
                Architecture Changes
                Testing Notes
                Follow-up Work
                """)
        Result<String> generate(@UserMessage String prompt);
    }

    public DocGenerationJobResponse generateFromWebhook(String rawBody) {
        DocWebhookRequest request;
        try {
            request = objectMapper.readValue(rawBody, DocWebhookRequest.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid webhook payload", e);
        }

        DocGenerationJob job = new DocGenerationJob();
        job.setRepoName(request.getRepoName());
        job.setRepoUrl(request.getRepoUrl());
        job.setCommitSha(request.getCommitSha());
        job.setCommitMessage(request.getCommitMessage());
        job.setPrNumber(request.getPrNumber());
        job.setBranchName(request.getBranchName());
        job.setChangedFiles(joinList(request.getChangedFiles()));
        job.setDiffSummary(request.getDiffSummary());
        job.setStatus(DocArtifactStatus.GENERATING);

        String owner = nullSafe(githubRepoOwner);
        String repo = nullSafe(githubRepoName);
        String commitContext = "";
        String prContext = "";
        String readmeContext = "";
        String repoDocsContext = "";
        String repoTreeContext = "";

        List<DocArtifact> recentArtifacts = artifactRepository.findAll().stream()
                .filter(a -> a.getTitle() != null && a.getTitle().toLowerCase().contains(request.getRepoName().toLowerCase()))
                .limit(3)
                .toList();

        String previousContext = recentArtifacts.stream()
                .map(DocArtifact::getMarkdownContent)
                .collect(Collectors.joining("\n\n---\n\n"));

        try {
            String githubToken = null;
            if (githubInstallationId != null && !githubInstallationId.isBlank()) {
                githubToken = gitHubAppService.getInstallationToken(Long.parseLong(githubInstallationId));
            }
            if (githubToken != null && !owner.isBlank() && !repo.isBlank()) {
                commitContext = gitHubAppService.fetchCommitDiff(owner, repo, request.getCommitSha(), githubToken);
                if (request.getPrNumber() != null && !request.getPrNumber().isBlank()) {
                    prContext = gitHubAppService.fetchPullRequestContext(owner, repo, request.getPrNumber(), githubToken);
                }
                readmeContext = gitHubAppService.fetchRepoReadme(owner, repo, githubToken);
                repoDocsContext = gitHubAppService.fetchRepoContext(owner, repo, githubToken);
                repoTreeContext = gitHubAppService.fetchRepoTreeSummary(owner, repo, githubToken);
            }
        } catch (Exception e) {
            log.warn("GitHub context fetch failed, continuing with available payload context", e);
        }

        job.setPreviousContext(previousContext);
        job.setCurrentContext(buildCurrentContext(request)
                + "\n\nGitHub Commit Context:\n" + commitContext
                + "\n\nGitHub PR Context:\n" + prContext
                + "\n\nRepo README Context:\n" + readmeContext
                + "\n\nRepo Documentation Context:\n" + repoDocsContext
                + "\n\nRepo File Tree Summary:\n" + repoTreeContext);

        DocGenerationJob savedJob = docJobRepository.save(job);
        String generatedMarkdown = generateDocument(savedJob);

        DocArtifact artifact = new DocArtifact();
        artifact.setJobId(savedJob.getId());
        artifact.setTitle(buildTitle(savedJob));
        artifact.setFileName(buildFileName(savedJob));
        artifact.setMarkdownContent(generatedMarkdown);
        artifact.setStatus(DocArtifactStatus.COMPLETED);
        artifactRepository.save(artifact);

        savedJob.setStatus(DocArtifactStatus.COMPLETED);
        docJobRepository.save(savedJob);

        return toResponse(savedJob);
    }

    public List<DocGenerationJobResponse> listJobs() {
        return docJobRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<DocArtifactResponse> listArtifacts(UUID jobId) {
        return artifactRepository.findByJobIdOrderByCreatedAtDesc(jobId).stream().map(this::toResponse).toList();
    }

    public GithubRepository connectRepo(com.example.backend.dto.GithubRepositoryRequest request) {
        GithubRepository repo = new GithubRepository();
        repo.setRepoUrl(request.getRepoUrl());
        repo.setRepoName(request.getRepoName());
        repo.setOwner(request.getOwner());
        repo.setDefaultBranch(request.getDefaultBranch() == null || request.getDefaultBranch().isBlank() ? "main" : request.getDefaultBranch());
        repo.setAuthType(request.getAuthType() == null || request.getAuthType().isBlank() ? "GITHUB_APP" : request.getAuthType());
        repo.setAccessToken(request.getAccessToken());
        repo.setInstallationId(request.getInstallationId());
        GithubRepository saved = githubRepositoryRepository.save(repo);
        ensureKnowledgeWorkspace(saved);
        return saved;
    }

    public List<GithubRepository> listRepos() {
        return githubRepositoryRepository.findAll();
    }

    public void deleteRepo(UUID repoId) {
        githubRepositoryRepository.deleteById(repoId);
    }

    public List<GithubCommitJob> listCommitJobs(UUID repoId) {
        return githubCommitJobRepository.findByRepoIdOrderByCreatedAtDesc(repoId);
    }

    public List<GithubCommitJob> syncRepo(UUID repoId) {
        GithubRepository repo = githubRepositoryRepository.findById(repoId).orElseThrow();
        UUID workspaceJobId = ensureKnowledgeWorkspace(repo);
        indexRepoDocsIntoKnowledge(repo, workspaceJobId);
        if (githubCommitJobRepository.findByRepoIdOrderByCreatedAtDesc(repoId).isEmpty()) {
            GithubCommitJob seed = new GithubCommitJob();
            seed.setRepoId(repoId);
            seed.setCommitSha("seed-" + repo.getRepoName().toLowerCase().replace(" ", "-"));
            seed.setCommitMessage("Initial sync for " + repo.getRepoName());
            seed.setChangedFiles(repo.getRepoUrl());
            githubCommitJobRepository.save(seed);
        }
        return githubCommitJobRepository.findByRepoIdOrderByCreatedAtDesc(repoId);
    }

    public GithubCommitJob triggerDocGeneration(UUID repoId, String commitSha, String mode) {
        GithubRepository repo = githubRepositoryRepository.findById(repoId).orElseThrow();
        boolean isSeedSync = commitSha != null && commitSha.startsWith("seed-");

        GithubCommitJob job = new GithubCommitJob();
        job.setRepoId(repoId);
        job.setCommitSha(commitSha);
        job.setCommitMessage(isSeedSync ? "Initial repository documentation baseline" : "Doc generation: " + mode);
        job.setChangedFiles(isSeedSync ? "Repository sync baseline" : "Generated from selected commit");
        job.setStatus("RUNNING");
        GithubCommitJob savedJob = githubCommitJobRepository.save(job);

        try {
            DocWebhookRequest request = buildRequestForRepo(repo, commitSha, mode, isSeedSync);

            String generatedMarkdown = generateDocument(buildDocGenerationJob(request, repo, isSeedSync));
            DocArtifact artifact = new DocArtifact();
            artifact.setJobId(repoId);
            artifact.setTitle(buildTitleForRepo(repo, commitSha, isSeedSync));
            artifact.setFileName(buildFileNameForRepo(repo, commitSha, isSeedSync));
            artifact.setMarkdownContent(generatedMarkdown);
            artifact.setStatus(DocArtifactStatus.COMPLETED);
            artifactRepository.save(artifact);

            savedJob.setStatus("COMPLETED");
            githubCommitJobRepository.save(savedJob);
            log.info("Generated doc artifact for repo {} commit {}", repo.getRepoName(), commitSha);
            return savedJob;
        } catch (Exception e) {
            log.error("Doc generation failed", e);
            savedJob.setStatus("FAILED");
            githubCommitJobRepository.save(savedJob);
            return savedJob;
        }
    }

    private DocWebhookRequest buildRequestForRepo(GithubRepository repo, String commitSha, String mode, boolean isSeedSync) {
        DocWebhookRequest request = new DocWebhookRequest();
        request.setRepoName(repo.getRepoName());
        request.setRepoUrl(repo.getRepoUrl());
        request.setCommitSha(commitSha);
        request.setCommitMessage(isSeedSync
                ? "Initial repository sync for " + repo.getRepoName()
                : "Auto-generated from commit " + commitSha);
        request.setBranchName(repo.getDefaultBranch());
        request.setPrNumber("");
        request.setChangedFiles(isSeedSync
                ? List.of("README.md", "ARCHITECTURE_SUMMARY.md", "IMPLEMENTATION_GUIDE.md", "INTERVIEW_PREP_GUIDE.md", "TESTING_GUIDE.md", "QUICK_REFERENCE.md")
                : List.of("Generated from selected commit"));
        request.setDiffSummary(isSeedSync
                ? "Create a baseline project document for the connected repository using existing docs, repo tree summary, and current repository structure."
                : "Triggered manually from GitHub Jobs page using mode " + mode);
        request.setTriggerType(mode);
        return request;
    }

    private DocGenerationJob buildDocGenerationJob(DocWebhookRequest request, GithubRepository repo, boolean isSeedSync) {
        DocGenerationJob job = new DocGenerationJob();
        job.setRepoName(request.getRepoName());
        job.setRepoUrl(request.getRepoUrl());
        job.setCommitSha(request.getCommitSha());
        job.setCommitMessage(request.getCommitMessage());
        job.setPrNumber(request.getPrNumber());
        job.setBranchName(request.getBranchName());
        job.setChangedFiles(joinList(request.getChangedFiles()));
        job.setDiffSummary(request.getDiffSummary());
        job.setStatus(DocArtifactStatus.COMPLETED);
        job.setPreviousContext(isSeedSync ? "Baseline document for connected repository" : "");
        job.setCurrentContext("""
                Commit message: %s
                Repo: %s
                Branch: %s
                Triggered by GitHub Jobs manual action
                """.formatted(request.getCommitMessage(), repo.getRepoName(), repo.getDefaultBranch()));
        return job;
    }

    private UUID ensureKnowledgeWorkspace(GithubRepository repo) {
        String workspaceName = "Knowledge: " + repo.getRepoName();
        Job existing = workspaceJobRepository.findAll().stream()
                .filter(j -> j.getJobType() == JobType.WORKSPACE)
                .filter(j -> workspaceName.equalsIgnoreCase(j.getName()))
                .findFirst()
                .orElse(null);

        if (existing != null) {
            return existing.getId();
        }

        LocalDateTime now = LocalDateTime.now();
        Job workspace = Job.builder()
                .name(workspaceName)
                .jobType(JobType.WORKSPACE)
                .url(repo.getRepoUrl())
                .method("GET")
                .status(JobStatus.PENDING)
                .retries(0)
                .maxRetries(0)
                .nextRun(now)
                .createdAt(now)
                .updatedAt(now)
                .createdBy("doc-agent")
                .recurring(false)
                .runsCount(0)
                .consecutiveFailures(0)
                .build();
        return workspaceJobRepository.save(workspace).getId();
    }

    private void indexRepoDocsIntoKnowledge(GithubRepository repo, UUID workspaceJobId) {
        String owner = nullSafe(repo.getOwner() != null ? repo.getOwner() : githubRepoOwner);
        String repoName = nullSafe(repo.getRepoName());
        String token = null;
        try {
            if (repo.getAuthType() != null && repo.getAuthType().equalsIgnoreCase("GITHUB_APP") && repo.getInstallationId() != null) {
                token = gitHubAppService.getInstallationToken(repo.getInstallationId());
            }
        } catch (Exception e) {
            log.warn("Unable to get installation token for repo knowledge indexing", e);
        }

        if (token == null || token.isBlank()) {
            return;
        }

        String repoContext = gitHubAppService.fetchRepoContext(owner, repoName, token);
        if (repoContext == null || repoContext.isBlank()) {
            repoContext = gitHubAppService.fetchRepoReadme(owner, repoName, token);
        }

        if (repoContext != null && !repoContext.isBlank()) {
            knowledgeService.ingestTextDocument(
                    workspaceJobId,
                    repoName + "-knowledge-baseline.md",
                    repo.getRepoUrl(),
                    repoContext
            );
        }
    }

    private String buildTitleForRepo(GithubRepository repo, String commitSha, boolean isSeedSync) {
        String suffix = commitSha == null ? "" : " @" + commitSha.substring(0, Math.min(7, commitSha.length()));
        return isSeedSync
                ? "Repository Documentation Baseline - " + repo.getRepoName()
                : "Updated Documentation - " + repo.getRepoName() + suffix;
    }

    private String buildFileNameForRepo(GithubRepository repo, String commitSha, boolean isSeedSync) {
        String safeName = repo.getRepoName().replaceAll("[^a-zA-Z0-9-_]+", "_");
        if (isSeedSync) {
            return safeName + "-baseline.md";
        }
        return safeName + "-" + commitSha.substring(0, Math.min(7, commitSha.length())) + ".md";
    }

    public DocArtifactResponse getArtifact(UUID id) {
        return artifactRepository.findById(id).map(this::toResponse).orElseThrow();
    }

    public List<DocArtifactResponse> listArtifacts() {
        return artifactRepository.findAll().stream().map(this::toResponse).toList();
    }

    public String downloadContent(UUID id) {
        return artifactRepository.findById(id).map(DocArtifact::getMarkdownContent).orElseThrow();
    }

    private String generateDocument(DocGenerationJob job) {
        try {
            OpenAiChatModel chatModel = OpenAiChatModel.builder()
                    .apiKey(groqApiKey)
                    .baseUrl("https://api.groq.com/openai/v1")
                    .modelName("llama-3.1-8b-instant")
                    .build();

            DocAssistant assistant = AiServices.builder(DocAssistant.class)
                    .chatLanguageModel(chatModel)
                    .chatMemoryProvider(memoryId -> MessageWindowChatMemory.builder()
                            .id(memoryId)
                            .maxMessages(10)
                            .chatMemoryStore(chatMemoryStore)
                            .build())
                    .build();

            String prompt = """
                    You are generating the official Markdown documentation for the Pulse project repository.

                    Repo: %s
                    Repo URL: %s
                    Commit SHA: %s
                    PR Number: %s
                    Branch: %s
                    Commit Message: %s

                    Changed Files:
                    %s

                    Change Summary:
                    %s

                    Previous Documentation Context:
                    %s

                    Current Context:
                    %s

                    Use the repo docs and tree summary to update the overall project documentation.
                    Treat the previous documentation as the source of truth for what already existed.
                    The output should read like a maintained project document, not a commit note.

                    Write a polished documentation update for the project.
                    If this is a baseline sync, produce a repository overview document with these sections:
                    Overview
                    Architecture
                    API Surface
                    Data Flow
                    Knowledge Base / RAG
                    GitHub Integration
                    Operational Notes
                    Next Steps

                    If this is a commit-specific update, include:
                    Overview
                    What Changed
                    Impacted Areas
                    API Changes
                    Architecture Changes
                    Testing Notes
                    Follow-up Work

                    Do not echo placeholder text like "Generated from selected commit".
                    Use the repo context to describe the actual product and how this change updates it.
                    """.formatted(
                    job.getRepoName(),
                    nullSafe(job.getRepoUrl()),
                    job.getCommitSha(),
                    nullSafe(job.getPrNumber()),
                    nullSafe(job.getBranchName()),
                    nullSafe(job.getCommitMessage()),
                    nullSafe(job.getChangedFiles()),
                    nullSafe(job.getDiffSummary()),
                    nullSafe(job.getPreviousContext()),
                    nullSafe(job.getCurrentContext())
            );

            return assistant.generate(prompt).content();
        } catch (Exception e) {
            log.warn("Doc generation via model failed, using fallback template", e);
            return fallbackMarkdown(job);
        }
    }

    private String fallbackMarkdown(DocGenerationJob job) {
        return """
                # %s

                ## Overview
                This document captures the current state of the %s repository and the latest synced change.

                ## What Changed
                %s

                ## Changed Files
                %s

                ## Previous Context
                %s

                ## Updated Context
                %s

                ## Notes
                - Review the generated doc against the actual code diff.
                - Extend API or architecture sections if new endpoints or flows were introduced.
                """.formatted(
                buildTitle(job),
                job.getRepoName(),
                nullSafe(job.getDiffSummary()),
                nullSafe(job.getChangedFiles()),
                summarize(job.getPreviousContext()),
                summarize(job.getCurrentContext())
        );
    }

    private String buildCurrentContext(DocWebhookRequest request) {
        return """
                Commit message: %s
                PR: %s
                Branch: %s
                Changed files: %s
                Diff summary: %s
                """.formatted(
                nullSafe(request.getCommitMessage()),
                nullSafe(request.getPrNumber()),
                nullSafe(request.getBranchName()),
                joinList(request.getChangedFiles()),
                nullSafe(request.getDiffSummary())
        );
    }

    private String buildTitle(DocGenerationJob job) {
        return "Updated Documentation - " + job.getRepoName() + " @" + job.getCommitSha().substring(0, Math.min(7, job.getCommitSha().length()));
    }

    private String buildFileName(DocGenerationJob job) {
        return job.getRepoName().replaceAll("[^a-zA-Z0-9-_]+", "_") + "-" + job.getCommitSha().substring(0, Math.min(7, job.getCommitSha().length())) + ".md";
    }

    private String joinList(List<String> items) {
        if (items == null || items.isEmpty()) return "";
        return items.stream().collect(Collectors.joining("\n"));
    }

    private String summarize(String value) {
        if (value == null) return "";
        return value.length() > 1200 ? value.substring(0, 1200) + "..." : value;
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private DocGenerationJobResponse toResponse(DocGenerationJob job) {
        return new DocGenerationJobResponse(
                job.getId(),
                job.getRepoName(),
                job.getRepoUrl(),
                job.getCommitSha(),
                job.getCommitMessage(),
                job.getPrNumber(),
                job.getBranchName(),
                job.getDiffSummary(),
                job.getPreviousContext(),
                job.getCurrentContext(),
                job.getStatus(),
                job.getCreatedAt(),
                job.getUpdatedAt()
        );
    }

    private DocArtifactResponse toResponse(DocArtifact artifact) {
        return new DocArtifactResponse(
                artifact.getId(),
                artifact.getJobId(),
                artifact.getTitle(),
                artifact.getFileName(),
                artifact.getMarkdownContent(),
                artifact.getStatus(),
                artifact.getCreatedAt()
        );
    }
}
