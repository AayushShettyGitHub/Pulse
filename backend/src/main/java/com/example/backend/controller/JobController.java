package com.example.backend.controller;

import com.example.backend.dto.CreateJobRequest;
import com.example.backend.dto.JobResponse;
import com.example.backend.service.JobService;
import com.example.backend.model.JobExecution;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import java.util.List;

@RestController
public class JobController {
    private final JobService jobService;
    
    public JobController(JobService jobService) {
        this.jobService = jobService;
    }
    
    @PostMapping({"/api/v1/jobs", "/api/jobs"})
    public ResponseEntity<JobResponse> createJob(
            @Valid @RequestBody CreateJobRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(jobService.createJob(request, userId));
    }
    
    @GetMapping({"/api/v1/jobs", "/api/jobs"})
    public ResponseEntity<List<JobResponse>> getAllJobs(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(jobService.getAllJobs(userId));
    }
    
    @GetMapping({"/api/v1/jobs/{id}", "/api/jobs/{id}"})
    public ResponseEntity<JobResponse> getJob(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(jobService.getJob(id, userId));
    }

    @GetMapping({"/api/v1/jobs/{id}/history", "/api/jobs/{id}/history"})
    public ResponseEntity<List<JobExecution>> getJobHistory(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(jobService.getJobHistory(id, userId));
    }

    @DeleteMapping({"/api/v1/jobs/{id}", "/api/jobs/{id}"})
    public ResponseEntity<Void> deleteJob(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        jobService.deleteJob(id, userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping({"/api/v1/jobs/{id}/pause", "/api/jobs/{id}/pause"})
    public ResponseEntity<JobResponse> pauseJob(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(jobService.pauseJob(id, userId));
    }

    @PutMapping({"/api/v1/jobs/{id}/resume", "/api/jobs/{id}/resume"})
    public ResponseEntity<JobResponse> resumeJob(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(jobService.resumeJob(id, userId));
    }
}
