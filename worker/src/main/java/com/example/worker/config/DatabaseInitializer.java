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
            jdbcTemplate.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS name VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS interval_minutes BIGINT");
            jdbcTemplate.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_runs INTEGER");
            jdbcTemplate.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS runs_count INTEGER DEFAULT 0");
            jdbcTemplate.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS next_run TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS consecutive_failures INTEGER DEFAULT 0");
            jdbcTemplate.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_consecutive_failures INTEGER DEFAULT 5");
            jdbcTemplate.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type VARCHAR(50) DEFAULT 'HTTP'");

            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS job_executions (" +
                    "id UUID PRIMARY KEY, " +
                    "job_id UUID NOT NULL, " +
                    "status VARCHAR(50), " +
                    "result TEXT, " +
                    "duration_ms BIGINT, " +
                    "response_time_ms BIGINT, " +
                    "status_code INTEGER, " +
                    "executed_at TIMESTAMP)");
            jdbcTemplate.execute("ALTER TABLE job_executions ADD COLUMN IF NOT EXISTS response_time_ms BIGINT");
            jdbcTemplate.execute("ALTER TABLE job_executions ADD COLUMN IF NOT EXISTS status_code INTEGER");
            
            log.info("Database schema initialized successfully.");
        } catch (Exception e) {
            log.error("Failed to initialize database: {}", e.getMessage());
        }
    }
}
