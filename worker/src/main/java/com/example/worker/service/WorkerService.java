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
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class WorkerService {

    private final JobRepository jobRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @RabbitListener(queues = "jobQueue")
    public void processJobMessage(String jobIdStr) {
        log.info("Received job message: {}", jobIdStr);
        UUID jobId = UUID.fromString(jobIdStr);
        Job job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            log.error("Job not found: {}", jobId);
            return;
        }
        processJob(job);
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

            String responseBody = response.getBody();
            if (responseBody == null || responseBody.isBlank()) {
                job.setResult("HTTP " + response.getStatusCode() + " (No Body)");
            } else {
                job.setResult(responseBody);
            }
            job.setStatus(JobStatus.SUCCESS);
            log.info("Job {} completed successfully with status {}.", job.getId(), response.getStatusCode());
        } catch (Exception e) {
            log.error("Error processing job {}: {}", job.getId(), e.getMessage());
            job.setResult("Error: " + e.getMessage());
            job.setStatus(JobStatus.FAILED);
        } finally {
            jobRepository.save(job);
        }
    }
}
