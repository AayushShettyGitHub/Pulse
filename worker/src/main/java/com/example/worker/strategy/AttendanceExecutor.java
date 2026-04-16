package com.example.worker.strategy;

import com.example.worker.model.Job;
import com.example.worker.model.JobExecution;
import com.example.worker.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AttendanceExecutor implements JobExecutor {
    
    private final EmailService emailService;
    
    @Value("${resend.admin.email}")
    private String adminEmail;

    @Override
    public boolean execute(Job job, JobExecution execution) {
        executeAttendancePrompt(job);
        int reportInterval = (job.getIntervalMinutes() != null && job.getIntervalMinutes() == 0) ? 3 : 7;
        if (job.getRunsCount() > 0 && job.getRunsCount() % reportInterval == 0) {
            executeAttendanceReport(job);
        }
        execution.setResult("Attendance daily/weekly cycles processed");
        return true;
    }

    private void executeAttendancePrompt(Job job) {
        emailService.sendEmail(adminEmail, "Pulse Attendance: Daily Reminder",
            "<p>Time to log your attendance.</p>" +
            "<a href='http://localhost:5173/attendance?id=" + job.getId() + "'>Enter Status</a>");
    }

    private void executeAttendanceReport(Job job) {
        emailService.sendEmail(adminEmail, "Pulse: Weekly Report",
            "<p>Your weekly attendance report is ready.</p>" +
            "<a href='http://localhost:5173/attendance-stats'>View Report</a>");
    }
}
