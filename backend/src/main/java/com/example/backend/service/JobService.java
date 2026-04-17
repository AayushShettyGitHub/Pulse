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

@Service
public class JobService {
    private final JobRepository jobRepository;
    private final com.example.backend.repository.JobExecutionRepository executionRepository;
    
    public JobService(JobRepository jobRepository, com.example.backend.repository.JobExecutionRepository executionRepository) {
        this.jobRepository = jobRepository;
        this.executionRepository = executionRepository;
    }
    
    public JobResponse createJob(CreateJobRequest request, String userId) {
        Job job = new Job();
        job.setName(request.getName());
        job.setJobType(JobType.valueOf(request.getJobType()));
        job.setUrl(request.getUrl());
        job.setMethod(request.getMethod().toUpperCase());
        job.setPayload(request.getPayload());
        job.setStatus(JobStatus.PENDING);
        job.setRetries(0);
        job.setMaxRetries(request.getMaxRetries());
        job.setNextRun(request.getStartTime() != null ? request.getStartTime() : LocalDateTime.now());
        job.setCreatedAt(LocalDateTime.now());
        job.setUpdatedAt(LocalDateTime.now());
        job.setCreatedBy(userId);
        job.setRecurring(request.isRecurring());
        job.setIntervalMinutes(request.getIntervalMinutes());
        job.setEndsAt(request.getEndsAt());
        job.setMaxRuns(request.getMaxRuns());
        job.setMaxConsecutiveFailures(request.getMaxConsecutiveFailures());
        job.setTimetableJson(request.getTimetableJson());
        job.setRunsCount(0);
        job.setConsecutiveFailures(0);
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

    public void deleteJob(UUID id, String userId) {
        Job job = jobRepository.findById(id).orElseThrow();
        if (job.getCreatedBy() != null && userId != null && !job.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Unauthorized access");
        }
        jobRepository.delete(job);
        executionRepository.deleteByJobId(id);
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
        JobResponse res = new JobResponse();
        res.setId(job.getId());
        res.setName(job.getName());
        res.setJobType(job.getJobType() != null ? job.getJobType().name() : "HTTP");
        res.setStatus(job.getStatus());
        res.setCreatedAt(job.getCreatedAt());
        res.setCreatedBy(job.getCreatedBy());
        res.setResult(job.getResult());
        res.setRecurring(job.isRecurring());
        res.setIntervalMinutes(job.getIntervalMinutes());
        res.setEndsAt(job.getEndsAt());
        res.setMaxRuns(job.getMaxRuns());
        res.setRunsCount(job.getRunsCount());
        res.setNextRun(job.getNextRun());
        res.setConsecutiveFailures(job.getConsecutiveFailures());
        res.setMaxConsecutiveFailures(job.getMaxConsecutiveFailures());
        res.setUrl(job.getUrl());
        res.setMethod(job.getMethod());
        res.setTimetableJson(job.getTimetableJson());
        return res;
    }
}
