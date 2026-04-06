package com.example.worker.service;

import com.example.worker.enums.JobStatus;
import com.example.worker.enums.JobType;
import com.example.worker.model.Job;
import com.example.worker.model.JobExecution;
import com.example.worker.repository.JobRepository;
import com.example.worker.repository.JobExecutionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Slf4j
public class WorkerService {

    private final JobRepository jobRepository;
    private final JobExecutionRepository executionRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public WorkerService(JobRepository jobRepository, JobExecutionRepository executionRepository) {
        this.jobRepository = jobRepository;
        this.executionRepository = executionRepository;
    }

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
        JobType type = job.getJobType() != null ? job.getJobType() : JobType.HTTP;
        switch (type) {
            case HEALTH_CHECK -> executeHealthCheck(job);
            default -> executeHttp(job);
        }
    }

    private void executeHealthCheck(Job job) {
        long startTime = System.currentTimeMillis();
        String result = null;
        JobStatus finalStatus = JobStatus.SUCCESS;
        Integer statusCode = null;
        Long responseTimeMs = null;

        try {
            job.setStatus(JobStatus.RUNNING);
            jobRepository.save(job);

            long pingStart = System.currentTimeMillis();
            ResponseEntity<String> response = restTemplate.exchange(
                    job.getUrl(), HttpMethod.GET, null, String.class);
            responseTimeMs = System.currentTimeMillis() - pingStart;
            statusCode = response.getStatusCode().value();

            result = "HTTP " + statusCode + " | " + responseTimeMs + "ms";
            job.setResult(result);
            job.setStatus(JobStatus.SUCCESS);
            job.setConsecutiveFailures(0);
            log.info("Health check {} OK: {}ms, status {}", job.getId(), responseTimeMs, statusCode);

        } catch (Exception e) {
            responseTimeMs = System.currentTimeMillis() - startTime;
            log.error("Health check {} FAILED: {}", job.getId(), e.getMessage());
            result = "DOWN: " + e.getMessage();
            job.setResult(result);
            job.setStatus(JobStatus.FAILED);
            job.setConsecutiveFailures(job.getConsecutiveFailures() + 1);
            finalStatus = JobStatus.FAILED;
            statusCode = 0;
        } finally {
            handleRecurring(job);
            job.setUpdatedAt(LocalDateTime.now());
            jobRepository.save(job);

            JobExecution execution = new JobExecution();
            execution.setJobId(job.getId());
            execution.setStatus(finalStatus);
            execution.setResult(result);
            execution.setDurationMs(System.currentTimeMillis() - startTime);
            execution.setResponseTimeMs(responseTimeMs);
            execution.setStatusCode(statusCode);
            execution.setExecutedAt(LocalDateTime.now());
            executionRepository.save(execution);
        }
    }

    private void executeHttp(Job job) {
        long startTime = System.currentTimeMillis();
        String result = null;
        JobStatus finalStatus = JobStatus.SUCCESS;
        Integer statusCode = null;

        try {
            log.info("Processing job: {} - {} {}", job.getId(), job.getMethod(), job.getUrl());
            job.setStatus(JobStatus.RUNNING);
            jobRepository.save(job);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(job.getPayload(), headers);
            HttpMethod method = HttpMethod.valueOf(job.getMethod().toUpperCase());

            long reqStart = System.currentTimeMillis();
            ResponseEntity<String> response = restTemplate.exchange(job.getUrl(), method, entity, String.class);
            long responseTimeMs = System.currentTimeMillis() - reqStart;
            statusCode = response.getStatusCode().value();

            String responseBody = response.getBody();
            if (responseBody == null || responseBody.isBlank()) {
                result = "HTTP " + response.getStatusCode() + " (No Body)";
            } else {
                result = responseBody;
            }
            job.setResult(result);
            job.setStatus(JobStatus.SUCCESS);
            job.setConsecutiveFailures(0);
            log.info("Job {} completed successfully.", job.getId());

        } catch (Exception e) {
            log.error("Error processing job {}: {}", job.getId(), e.getMessage());
            result = "Error: " + e.getMessage();
            job.setResult(result);
            job.setStatus(JobStatus.FAILED);
            job.setConsecutiveFailures(job.getConsecutiveFailures() + 1);
            finalStatus = JobStatus.FAILED;
        } finally {
            handleRecurring(job);
            job.setUpdatedAt(LocalDateTime.now());
            jobRepository.save(job);

            JobExecution execution = new JobExecution();
            execution.setJobId(job.getId());
            execution.setStatus(finalStatus);
            execution.setResult(result);
            execution.setDurationMs(System.currentTimeMillis() - startTime);
            execution.setStatusCode(statusCode);
            execution.setExecutedAt(LocalDateTime.now());
            executionRepository.save(execution);
        }
    }

    private void handleRecurring(Job job) {
        if (!job.isRecurring()) return;

        job.setRunsCount(job.getRunsCount() + 1);

        boolean shouldReschedule = true;
        if (job.getMaxRuns() != null && job.getRunsCount() >= job.getMaxRuns()) {
            shouldReschedule = false;
            log.info("Job {} reached max runs.", job.getId());
        } else if (job.getMaxConsecutiveFailures() != null && job.getConsecutiveFailures() >= job.getMaxConsecutiveFailures()) {
            shouldReschedule = false;
            log.info("Job {} stopped due to consecutive failures ({}).", job.getId(), job.getConsecutiveFailures());
        } else if (job.getEndsAt() != null && LocalDateTime.now().plusMinutes(job.getIntervalMinutes()).isAfter(job.getEndsAt())) {
            shouldReschedule = false;
            log.info("Job {} reached end time.", job.getId());
        }

        if (shouldReschedule && job.getIntervalMinutes() != null) {
            job.setStatus(JobStatus.PENDING);
            job.setNextRun(LocalDateTime.now().plusMinutes(job.getIntervalMinutes()));
            log.info("Job {} rescheduled for {}.", job.getId(), job.getNextRun());
        }
    }
}
