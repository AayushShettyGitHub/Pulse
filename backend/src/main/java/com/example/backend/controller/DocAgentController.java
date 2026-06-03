package com.example.backend.controller;

import com.example.backend.dto.DocArtifactResponse;
import com.example.backend.dto.GithubRepositoryRequest;
import com.example.backend.dto.GithubRepositoryResponse;
import com.example.backend.dto.DocGenerationJobResponse;
import com.example.backend.service.DocAgentService;
import com.example.backend.model.GithubCommitJob;
import com.example.backend.model.GithubRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/doc-agent")
@RequiredArgsConstructor
public class DocAgentController {

    private final DocAgentService docAgentService;
    private final com.example.backend.service.GitHubAppService gitHubAppService;

    @PostMapping("/webhook")
    public ResponseEntity<DocGenerationJobResponse> ingestWebhook(
            @RequestBody String rawBody,
            HttpServletRequest servletRequest) {
        String signature = servletRequest.getHeader("X-Hub-Signature-256");
        if (!gitHubAppService.verifyWebhookSignature(rawBody, signature)) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(docAgentService.generateFromWebhook(rawBody));
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<DocGenerationJobResponse>> listJobs() {
        return ResponseEntity.ok(docAgentService.listJobs());
    }

    @GetMapping("/jobs/{jobId}/artifacts")
    public ResponseEntity<List<DocArtifactResponse>> listArtifacts(@PathVariable UUID jobId) {
        return ResponseEntity.ok(docAgentService.listArtifacts(jobId));
    }

    @GetMapping("/artifacts/{artifactId}")
    public ResponseEntity<DocArtifactResponse> getArtifact(@PathVariable UUID artifactId) {
        return ResponseEntity.ok(docAgentService.getArtifact(artifactId));
    }

    @GetMapping("/artifacts")
    public ResponseEntity<List<DocArtifactResponse>> listArtifacts() {
        return ResponseEntity.ok(docAgentService.listArtifacts());
    }

    @GetMapping("/artifacts/{artifactId}/download")
    public ResponseEntity<byte[]> downloadArtifact(@PathVariable UUID artifactId) {
        DocArtifactResponse artifact = docAgentService.getArtifact(artifactId);
        byte[] content = artifact.getMarkdownContent().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + artifact.getFileName() + "\"")
                .contentType(MediaType.parseMediaType("text/markdown"))
                .body(content);
    }

    @PostMapping("/repos/connect")
    public ResponseEntity<GithubRepositoryResponse> connectRepo(@RequestBody GithubRepositoryRequest request) {
        GithubRepository repo = docAgentService.connectRepo(request);
        return ResponseEntity.ok(new GithubRepositoryResponse(
                repo.getId(), repo.getRepoUrl(), repo.getRepoName(), repo.getOwner(),
                repo.getDefaultBranch(), repo.getAuthType(), repo.getInstallationId(),
                repo.getCreatedAt(), repo.getUpdatedAt()
        ));
    }

    @GetMapping("/repos")
    public ResponseEntity<List<GithubRepositoryResponse>> listRepos() {
        return ResponseEntity.ok(docAgentService.listRepos().stream().map(repo -> new GithubRepositoryResponse(
                repo.getId(), repo.getRepoUrl(), repo.getRepoName(), repo.getOwner(),
                repo.getDefaultBranch(), repo.getAuthType(), repo.getInstallationId(),
                repo.getCreatedAt(), repo.getUpdatedAt()
        )).toList());
    }

    @DeleteMapping("/repos/{repoId}")
    public ResponseEntity<Void> deleteRepo(@PathVariable UUID repoId) {
        docAgentService.deleteRepo(repoId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/repos/{repoId}/sync")
    public ResponseEntity<List<GithubCommitJob>> syncRepo(@PathVariable UUID repoId) {
        return ResponseEntity.ok(docAgentService.syncRepo(repoId));
    }

    @GetMapping("/repos/{repoId}/commits")
    public ResponseEntity<List<GithubCommitJob>> listCommits(@PathVariable UUID repoId) {
        return ResponseEntity.ok(docAgentService.listCommitJobs(repoId));
    }

    @PostMapping("/repos/{repoId}/docs/generate")
    public ResponseEntity<GithubCommitJob> triggerDocs(@PathVariable UUID repoId, @RequestBody java.util.Map<String, String> payload) {
        return ResponseEntity.ok(docAgentService.triggerDocGeneration(repoId, payload.get("commitSha"), payload.getOrDefault("mode", "AUTO_DOCS")));
    }
}
