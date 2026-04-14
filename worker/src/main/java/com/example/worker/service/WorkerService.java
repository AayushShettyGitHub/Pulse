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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.example.worker.model.AttendanceRecord;
import com.example.worker.repository.AttendanceRepository;

@Service
@Slf4j
public class WorkerService {

    private final JobRepository jobRepository;
    private final JobExecutionRepository executionRepository;
    private final AttendanceRepository attendanceRepository;
    private final EmailService emailService;
    private final RestTemplate restTemplate = new RestTemplate();

    @org.springframework.beans.factory.annotation.Value("${resend.admin.email}")
    private String adminEmail;

    public WorkerService(JobRepository jobRepository, JobExecutionRepository executionRepository, 
                         AttendanceRepository attendanceRepository, EmailService emailService) {
        this.jobRepository = jobRepository;
        this.executionRepository = executionRepository;
        this.attendanceRepository = attendanceRepository;
        this.emailService = emailService;
    }

    @RabbitListener(queues = "jobQueue")
    public void processJobMessage(String jobIdStr) {
        UUID jobId = UUID.fromString(jobIdStr);
        Job job = jobRepository.findById(jobId).orElse(null);
        if (job == null) return;
        processJob(job);
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

            JobType jobType = (job.getJobType() != null) 
                ? job.getJobType() 
                : JobType.HTTP;

            success = switch (jobType) {
                case HEALTH_CHECK -> executeHealthCheck(job, execution);
                case ATTENDANCE_TRACKER -> executeAttendanceTracker(job, execution);
                default -> executeHttp(job, execution);
            };

            if (success) {
                handleSuccess(job);
            } else {
                handleFailure(job);
            }
        } catch (Exception e) {
            handleFailure(job);
            execution.setResult("Fatal Error: " + e.getMessage());
        } finally {
            execution.setStatus(success ? JobStatus.SUCCESS : JobStatus.FAILED);
            execution.setDurationMs(System.currentTimeMillis() - startTime);
            executionRepository.save(execution);
            finalizeJob(job);
        }
    }

    private boolean executeHealthCheck(Job job, JobExecution execution) {
        try {
            long pingStart = System.currentTimeMillis();
            ResponseEntity<String> response = restTemplate.exchange(job.getUrl(), HttpMethod.GET, null, String.class);
            long responseTimeMs = System.currentTimeMillis() - pingStart;
            
            execution.setResponseTimeMs(responseTimeMs);
            execution.setStatusCode(response.getStatusCode().value());
            execution.setResult("HTTP " + response.getStatusCode().value() + " | " + responseTimeMs + "ms");
            
            job.setResult(execution.getResult());
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            execution.setResult("DOWN: " + e.getMessage());
            execution.setStatusCode(0);
            job.setResult(execution.getResult());
            return false;
        }
    }

    private boolean executeHttp(Job job, JobExecution execution) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(job.getPayload(), headers);
            HttpMethod method = HttpMethod.valueOf(job.getMethod().toUpperCase());

            ResponseEntity<String> response = restTemplate.exchange(job.getUrl(), method, entity, String.class);
            execution.setStatusCode(response.getStatusCode().value());
            execution.setResult(response.getBody() == null || response.getBody().isBlank() ? "HTTP " + response.getStatusCode() : response.getBody());
            
            job.setResult(execution.getResult());
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            execution.setResult("Error: " + e.getMessage());
            job.setResult(execution.getResult());
            return false;
        }
    }

    private boolean executeAttendanceTracker(Job job, JobExecution execution) {
        executeAttendancePrompt(job, execution);
        int reportInterval = (job.getIntervalMinutes() != null && job.getIntervalMinutes() == 0) ? 3 : 7;
        if (job.getRunsCount() > 0 && job.getRunsCount() % reportInterval == 0) {
            executeAttendanceReport(job, execution);
        }
        return true;
    }

    private boolean executeAttendancePrompt(Job job, JobExecution execution) {
        emailService.sendEmail(adminEmail, "Pulse Attendance: Daily Reminder",
            "<h3>Mark Today's Attendance</h3>" +
            "<p>Time to log your attendance! If you ignore this, you'll be marked absent for all subjects in your timetable.</p>" +
            "<a href='http://localhost:5173/attendance?id=" + job.getId() + "' style='background:#6366f1;color:white;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;'>ENTER STATUS</a>");
        execution.setResult("Daily prompt sent");
        return true;
    }

    private boolean executeAttendanceReport(Job job, JobExecution execution) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(7);
        List<AttendanceRecord> records = attendanceRepository.findByJobIdAndDateBetween(job.getId(), start, end);
        
        long totalPresent = records.stream().filter(AttendanceRecord::isAttended).count();
        double overallPercent = records.isEmpty() ? 0 : (double) totalPresent / records.size() * 100;

        StringBuilder tableRows = new StringBuilder();
        Map<String, List<AttendanceRecord>> bySubject = records.stream()
            .collect(java.util.stream.Collectors.groupingBy(AttendanceRecord::getSubject));

        bySubject.forEach((subject, subRecords) -> {
            long subPresent = subRecords.stream().filter(AttendanceRecord::isAttended).count();
            double subPercent = (double) subPresent / subRecords.size() * 100;
            String color = subPercent >= 75 ? "#22c55e" : "#ef4444";
            
            tableRows.append(String.format(
                "<tr>" +
                "<td style='padding:10px;border-bottom:1px solid #eee;'>%s</td>" +
                "<td style='padding:10px;border-bottom:1px solid #eee;font-weight:bold;color:%s;'>%.1f%%</td>" +
                "<td style='padding:10px;border-bottom:1px solid #eee;color:#666;'>%d/%d</td>" +
                "</tr>",
                subject, color, subPercent, subPresent, subRecords.size()
            ));
        });

        String reportHtml = String.format(
            "<div style='font-family:sans-serif;max-width:500px;margin:auto;border:1px solid #eee;border-radius:16px;padding:20px;'>" +
            "<h2 style='color:#1e1b4b;margin-bottom:5px;'>Attendance Scorecard</h2>" +
            "<p style='color:#6366f1;font-weight:bold;margin-top:0;'>OVERALL: %.1f%%</p>" +
            "<table style='width:100%%;border-collapse:collapse;margin-top:20px;'>" +
            "<thead><tr style='text-align:left;color:#999;font-size:12px;text-transform:uppercase;'>" +
            "<th style='padding:10px;'>Subject</th><th style='padding:10px;'>Status</th><th style='padding:10px;'>Count</th>" +
            "</tr></thead>" +
            "<tbody>%s</tbody>" +
            "</table>" +
            "<p style='font-size:12px;color:#999;margin-top:20px;'>Keep attending classes to stay above 75%%!</p>" +
            "</div>",
            overallPercent, tableRows.toString());

        emailService.sendEmail(adminEmail, "Pulse: Detailed Attendance Report", reportHtml);
        execution.setResult("Detailed report sent. Overall: " + overallPercent + "%");
        return true;
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
        if (job.getMaxRuns() != null && job.getRunsCount() >= job.getMaxRuns()) return true;
        if (job.getMaxConsecutiveFailures() != null && job.getConsecutiveFailures() >= job.getMaxConsecutiveFailures()) return true;
        if (job.getEndsAt() != null && LocalDateTime.now().plusMinutes(job.getIntervalMinutes()).isAfter(job.getEndsAt())) return true;
        return false;
    }
}
