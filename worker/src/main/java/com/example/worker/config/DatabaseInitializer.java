package com.example.worker.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        log.info("Initializing database schema if needed...");
        try {
            // Create jobs table if it doesn't exist
            String createJobsTable = "CREATE TABLE IF NOT EXISTS jobs (" +
                    "id UUID PRIMARY KEY, " +
                    "name VARCHAR(255) NOT NULL, " +
                    "job_type VARCHAR(50) DEFAULT 'HTTP', " +
                    "url VARCHAR(2048) NOT NULL, " +
                    "method VARCHAR(10) NOT NULL, " +
                    "payload TEXT, " +
                    "status VARCHAR(50), " +
                    "result TEXT, " +
                    "timetable_json TEXT, " +
                    "retries INTEGER DEFAULT 0, " +
                    "max_retries INTEGER DEFAULT 3, " +
                    "retry_delay INTEGER DEFAULT 30, " +
                    "next_run TIMESTAMP, " +
                    "created_at TIMESTAMP, " +
                    "updated_at TIMESTAMP, " +
                    "created_by VARCHAR(255), " +
                    "recurring BOOLEAN DEFAULT FALSE, " +
                    "interval_minutes BIGINT, " +
                    "ends_at TIMESTAMP, " +
                    "max_runs INTEGER, " +
                    "runs_count INTEGER DEFAULT 0, " +
                    "consecutive_failures INTEGER DEFAULT 0, " +
                    "max_consecutive_failures INTEGER DEFAULT 5)";
            jdbcTemplate.execute(createJobsTable);

            // Create job_executions table if it doesn't exist
            String createJobExecutionsTable = "CREATE TABLE IF NOT EXISTS job_executions (" +
                    "id UUID PRIMARY KEY, " +
                    "job_id UUID NOT NULL, " +
                    "job_type VARCHAR(50), " +
                    "status VARCHAR(50), " +
                    "result TEXT, " +
                    "duration_ms BIGINT, " +
                    "response_time_ms BIGINT, " +
                    "status_code INTEGER, " +
                    "executed_at TIMESTAMP)";
            jdbcTemplate.execute(createJobExecutionsTable);

            // Create attendance_records table if it doesn't exist
            String createAttendanceTable = "CREATE TABLE IF NOT EXISTS attendance_record (" +
                    "id BIGSERIAL PRIMARY KEY, " +
                    "job_id UUID, " +
                    "subject VARCHAR(255), " +
                    "date DATE, " +
                    "attended BOOLEAN)";
            try {
                jdbcTemplate.execute(createAttendanceTable);
            } catch (Exception e) {
                log.debug("Attendance table creation skipped (may use different schema): {}", e.getMessage());
            }
            
            log.info("Database schema initialized successfully.");
        } catch (Exception e) {
            log.error("Failed to initialize database: {}", e.getMessage());
        }
    }
}
