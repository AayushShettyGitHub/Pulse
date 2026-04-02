package com.example.worker.service;

import com.example.worker.enums.JobStatus;
import com.example.worker.model.Job;
import com.example.worker.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class WorkerService {

    private final JobRepository jobRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Scheduled(fixedDelay = 5000) // Runs every 5 seconds
    public void processPendingJobs() {
        log.info("Checking for pending jobs...");
        List<Job> pendingJobs = jobRepository.findByStatus(JobStatus.PENDING);

        if (pendingJobs.isEmpty()) {
            return;
        }

        log.info("Found {} pending jobs. Processing...", pendingJobs.size());

        for (Job job : pendingJobs) {
            processJob(job);
        }
    }

    public void processJob(Job job) {
        try {
            log.info("Processing job: {} - {} {}", job.getId(), job.getMethod(), job.getUrl());
            job.setStatus(JobStatus.RUNNING);
            jobRepository.save(job);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> entity = new HttpEntity<>(job.getPayload(), headers);
            HttpMethod method = HttpMethod.valueOf(job.getMethod().toUpperCase());

            org.springframework.http.ResponseEntity<String> response = restTemplate.exchange(job.getUrl(), method, entity, String.class);

            job.setResult(response.getBody());
            job.setStatus(JobStatus.SUCCESS);
            log.info("Job {} completed successfully.", job.getId());
        } catch (Exception e) {
            log.error("Error processing job {}: {}", job.getId(), e.getMessage());
            job.setResult("Error: " + e.getMessage());
            job.setStatus(JobStatus.FAILED);
        } finally {
            jobRepository.save(job);
        }
    }
}
