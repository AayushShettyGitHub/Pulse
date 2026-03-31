package com.example.backend.service;

import com.example.backend.dto.CreateJobRequest;
import com.example.backend.dto.JobResponse;
import com.example.backend.enums.JobStatus;
import com.example.backend.model.Job;
import com.example.backend.repository.JobRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class JobService {
    private final JobRepository jobRepository;
    
    public JobService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }
    
    public JobResponse createJob(CreateJobRequest request, String userId) {
        Job job = new Job();
        job.setUrl(request.getUrl());
        job.setMethod(request.getMethod().toUpperCase());
        job.setPayload(request.getPayload());
        job.setStatus(JobStatus.PENDING);
        job.setRetries(0);
        job.setMaxRetries(request.getMaxRetries());
        job.setNextRun(LocalDateTime.now());
        job.setCreatedAt(LocalDateTime.now());
        job.setUpdatedAt(LocalDateTime.now());
        job.setCreatedBy(userId);
        Job saved = jobRepository.save(job);
        return mapToResponse(saved, userId);
    }
    
    public JobResponse getJob(UUID id, String userId) {
        Job job = jobRepository.findById(id).orElseThrow();
        return mapToResponse(job, userId);
    }

    public java.util.List<JobResponse> getAllJobs(String userId) {
        return jobRepository.findAll().stream()
                .map(job -> mapToResponse(job, userId))
                .collect(java.util.stream.Collectors.toList());
    }
    
    private JobResponse mapToResponse(Job job, String userId) {
        JobResponse res = new JobResponse();
        res.setId(job.getId());
        res.setStatus(job.getStatus());
        res.setCreatedAt(job.getCreatedAt());
        if (userId != null && !userId.isEmpty()) {
            res.setCreatedBy(userId);
        }
        return res;
    }
}
