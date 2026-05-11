package com.example.backend.service;

import com.example.backend.dto.CreateJobRequest;
import com.example.backend.dto.JobResponse;
import com.example.backend.enums.JobStatus;
import com.example.backend.enums.JobType;
import com.example.backend.model.Job;
import com.example.backend.model.JobExecution;
import com.example.backend.repository.JobRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.example.backend.repository.JobExecutionRepository;

@Service
public class JobService {
    private final JobRepository jobRepository;
    private final JobExecutionRepository executionRepository;
    private final KnowledgeService knowledgeService;
    private final com.example.backend.repository.ChatMessageRepository chatMessageRepository;
    
    public JobService(JobRepository jobRepository, 
                      JobExecutionRepository executionRepository, 
                      KnowledgeService knowledgeService,
                      com.example.backend.repository.ChatMessageRepository chatMessageRepository) {
        this.jobRepository = jobRepository;
        this.executionRepository = executionRepository;
        this.knowledgeService = knowledgeService;
        this.chatMessageRepository = chatMessageRepository;
    }
    
    public JobResponse createJob(CreateJobRequest request, String userId) {
        LocalDateTime now = LocalDateTime.now();
        Job job = Job.builder()
                .name(request.getName())
                .jobType(JobType.valueOf(request.getJobType()))
                .url(request.getUrl())
                .method(request.getMethod().toUpperCase())
                .payload(request.getPayload())
                .status(JobStatus.PENDING)
                .retries(0)
                .maxRetries(request.getMaxRetries())
                .nextRun(request.getStartTime() != null ? request.getStartTime() : now)
                .createdAt(now)
                .updatedAt(now)
                .createdBy(userId)
                .recurring(request.isRecurring())
                .intervalMinutes(request.getIntervalMinutes())
                .endsAt(request.getEndsAt())
                .maxRuns(request.getMaxRuns())
                .maxConsecutiveFailures(request.getMaxConsecutiveFailures())
                .timetableJson(request.getTimetableJson())
                .runsCount(0)
                .consecutiveFailures(0)
                .build();
        
        Job saved = jobRepository.save(job);
        return mapToResponse(saved, userId);
    }
    
    public JobResponse getJob(UUID id, String userId) {
        Job job = jobRepository.findById(id).orElseThrow();
        return mapToResponse(job, userId);
    }

    public List<JobExecution> getJobHistory(UUID jobId, String userId) {
        Job job = jobRepository.findById(jobId).orElseThrow();
        if (job.getCreatedBy() != null && userId != null && !job.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Unauthorized access");
        }
        return executionRepository.findByJobIdOrderByExecutedAtDesc(jobId);
    }
    
    public List<JobResponse> getAllJobs(String userId) {
        List<Job> jobs;
        if (userId != null && !userId.isEmpty()) {
            final String lowerUserId = userId.toLowerCase();
            jobs = jobRepository.findAll().stream()
                    .filter(j -> j.getCreatedBy() != null && j.getCreatedBy().toLowerCase().equals(lowerUserId))
                    .collect(java.util.stream.Collectors.toList());
        } else {
            jobs = jobRepository.findAll();
        }
        return jobs.stream()
                .map(job -> mapToResponse(job, userId))
                .collect(java.util.stream.Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteJob(UUID id, String userId) {
        Job job = jobRepository.findById(id).orElseThrow();
        if (job.getCreatedBy() != null && userId != null && !job.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Unauthorized access");
        }
        knowledgeService.deleteByJobId(id);
        executionRepository.deleteByJobId(id);
        chatMessageRepository.deleteByJobId(id);
        jobRepository.delete(job);
    }

    public JobResponse pauseJob(UUID id, String userId) {
        Job job = jobRepository.findById(id).orElseThrow();
        if (job.getCreatedBy() != null && userId != null && !job.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Unauthorized access");
        }
        job.setStatus(JobStatus.PAUSED);
        job.setUpdatedAt(LocalDateTime.now());
        return mapToResponse(jobRepository.save(job), userId);
    }

    public JobResponse resumeJob(UUID id, String userId) {
        Job job = jobRepository.findById(id).orElseThrow();
        if (job.getCreatedBy() != null && userId != null && !job.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Unauthorized access");
        }
        job.setStatus(JobStatus.PENDING);
        job.setUpdatedAt(LocalDateTime.now());
        return mapToResponse(jobRepository.save(job), userId);
    }
    
    private JobResponse mapToResponse(Job job, String userId) {
        return JobResponse.builder()
                .id(job.getId())
                .name(job.getName())
                .jobType(job.getJobType() != null ? job.getJobType().name() : "HTTP")
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .createdBy(job.getCreatedBy())
                .result(job.getResult())
                .recurring(job.isRecurring())
                .intervalMinutes(job.getIntervalMinutes())
                .endsAt(job.getEndsAt())
                .maxRuns(job.getMaxRuns())
                .runsCount(job.getRunsCount())
                .nextRun(job.getNextRun())
                .consecutiveFailures(job.getConsecutiveFailures())
                .maxConsecutiveFailures(job.getMaxConsecutiveFailures())
                .url(job.getUrl())
                .method(job.getMethod())
                .timetableJson(job.getTimetableJson())
                .build();
    }
}
