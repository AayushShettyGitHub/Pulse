package com.example.worker.service;

import com.example.worker.enums.JobStatus;
import com.example.worker.enums.JobType;
import com.example.worker.model.Job;
import com.example.worker.model.JobExecution;
import com.example.worker.repository.JobRepository;
import com.example.worker.repository.JobExecutionRepository;
import com.example.worker.strategy.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class WorkerService {

    private final JobRepository jobRepository;
    private final JobExecutionRepository executionRepository;
    private final EmailService emailService;
    private final HttpExecutor httpExecutor;
    private final HealthCheckExecutor healthCheckExecutor;
    private final AttendanceExecutor attendanceExecutor;
    private final RagIngestionExecutor ragIngestionExecutor;

    @Value("${resend.admin.email}")
    private String adminEmail;

    public void processJobById(UUID jobId) {
        jobRepository.findById(jobId).ifPresent(this::processJob);
    }

    public void processJob(Job job) {
        long startTime = System.currentTimeMillis();
        boolean success = false;
        JobExecution execution = new JobExecution();
        execution.setJobId(job.getId());
        execution.setExecutedAt(LocalDateTime.now());

        try {
            job.setStatus(JobStatus.RUNNING);
            jobRepository.save(job);

            JobExecutor executor = getExecutor(job.getJobType());
            success = executor.execute(job, execution);

            if (success) {
                handleSuccess(job);
            } else {
                handleFailure(job);
            }
        } catch (Exception e) {
            log.error("Job execution failed: {}", e.getMessage());
            handleFailure(job);
            execution.setResult("Fatal Error: " + e.getMessage());
        } finally {
            execution.setStatus(success ? JobStatus.SUCCESS : JobStatus.FAILED);
            execution.setDurationMs(System.currentTimeMillis() - startTime);
            executionRepository.save(execution);
            finalizeJob(job);
        }
    }

    private JobExecutor getExecutor(JobType jobType) {
        if (jobType == null)
            return httpExecutor;
        return switch (jobType) {
            case HEALTH_CHECK -> healthCheckExecutor;
            case ATTENDANCE_TRACKER -> attendanceExecutor;
            case RAG_INGESTION -> ragIngestionExecutor;
            default -> httpExecutor;
        };
    }

    private void handleSuccess(Job job) {
        job.setStatus(JobStatus.SUCCESS);
        job.setRetries(0);
        job.setConsecutiveFailures(0);
    }

    private void handleFailure(Job job) {
        if (job.getRetries() < job.getMaxRetries()) {
            job.setRetries(job.getRetries() + 1);
            job.setStatus(JobStatus.RETRYING);
            job.setNextRun(LocalDateTime.now().plusSeconds(job.getRetryDelay()));
        } else {
            job.setStatus(JobStatus.FAILED);
            job.setConsecutiveFailures(job.getConsecutiveFailures() + 1);
            job.setRetries(0);

            if (job.getJobType() == JobType.HEALTH_CHECK && job.getConsecutiveFailures() == 1) {
                emailService.sendEmail(adminEmail,
                        "PULSE ALERT: " + job.getName() + " is OFFLINE",
                        "<h3>Uptime Bot Alert</h3>" +
                                "<p>Your service <b>" + job.getName() + "</b> has failed all recovery attempts.</p>" +
                                "<p><b>URL:</b> " + job.getUrl() + "</p>" +
                                "<p><b>Error:</b> " + job.getResult() + "</p>" +
                                "<p><b>Timestamp:</b> " + LocalDateTime.now() + "</p>");
            }
        }
    }

    private void finalizeJob(Job job) {
        if (job.isRecurring() && job.getStatus() != JobStatus.RETRYING) {
            job.setRunsCount(job.getRunsCount() + 1);
            if (shouldStop(job)) {
                job.setStatus(JobStatus.SUCCESS);
                job.setNextRun(null);
            } else {
                job.setStatus(JobStatus.PENDING);
                if (job.getIntervalMinutes() != null && job.getIntervalMinutes() == 0) {
                    job.setNextRun(LocalDateTime.now().plusSeconds(30));
                } else {
                    job.setNextRun(LocalDateTime.now().plusMinutes(job.getIntervalMinutes()));
                }
            }
        }
        job.setUpdatedAt(LocalDateTime.now());
        jobRepository.save(job);
    }

    private boolean shouldStop(Job job) {
        if (job.getMaxRuns() != null && job.getRunsCount() >= job.getMaxRuns())
            return true;
        if (job.getMaxConsecutiveFailures() != null && job.getConsecutiveFailures() >= job.getMaxConsecutiveFailures())
            return true;
        if (job.getEndsAt() != null
                && LocalDateTime.now().plusMinutes(job.getIntervalMinutes()).isAfter(job.getEndsAt()))
            return true;
        return false;
    }
}
