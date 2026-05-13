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
        String timetable = job.getTimetableJson();
        String subjectList = "";
        try {
            String[] subjects = new com.fasterxml.jackson.databind.ObjectMapper().readValue(timetable, String[].class);
            StringBuilder sb = new StringBuilder();
            for (String s : subjects) {
                sb.append("<li style='padding:4px 0;color:#374151;font-size:14px;'>").append(s).append("</li>");
            }
            subjectList = sb.toString();
        } catch (Exception ignored) {}

        String html = "<div style='font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;'>" +
            "<div style='background:#0284c7;padding:24px 32px;border-radius:12px 12px 0 0;'>" +
            "  <h1 style='margin:0;color:#fff;font-size:20px;font-weight:700;'>⚡ Pulse Attendance</h1>" +
            "  <p style='margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;'>Daily check-in reminder</p>" +
            "</div>" +
            "<div style='background:#ffffff;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;'>" +
            "  <p style='color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;'>Hi there! It's time to log your attendance for today's sessions:</p>" +
            "  <ul style='margin:0 0 20px;padding-left:20px;'>" + subjectList + "</ul>" +
            "  <a href='http://localhost:3000/attendance?id=" + job.getId() + "' " +
            "     style='display:inline-block;background:#0284c7;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;'>" +
            "     Mark Attendance →</a>" +
            "</div>" +
            "<div style='padding:16px 32px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;'>" +
            "  <p style='margin:0;color:#9ca3af;font-size:11px;'>Sent by Pulse Scheduler · " + job.getName() + "</p>" +
            "</div></div>";

        emailService.sendEmail(adminEmail, "⚡ Pulse: Daily Attendance — " + job.getName(), html);
    }

    private void executeAttendanceReport(Job job) {
        String html = "<div style='font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;'>" +
            "<div style='background:#16a34a;padding:24px 32px;border-radius:12px 12px 0 0;'>" +
            "  <h1 style='margin:0;color:#fff;font-size:20px;font-weight:700;'>📊 Weekly Report</h1>" +
            "  <p style='margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;'>" + job.getName() + "</p>" +
            "</div>" +
            "<div style='background:#ffffff;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;'>" +
            "  <p style='color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;'>Your weekly attendance report is ready for review.</p>" +
            "  <a href='http://localhost:3000/attendance-stats' " +
            "     style='display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;'>" +
            "     View Report →</a>" +
            "</div>" +
            "<div style='padding:16px 32px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;'>" +
            "  <p style='margin:0;color:#9ca3af;font-size:11px;'>Sent by Pulse Scheduler</p>" +
            "</div></div>";

        emailService.sendEmail(adminEmail, "📊 Pulse: Weekly Attendance Report — " + job.getName(), html);
    }
}
