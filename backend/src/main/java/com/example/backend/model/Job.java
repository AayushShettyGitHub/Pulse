package com.example.backend.model;

import com.example.backend.enums.JobStatus;
import com.example.backend.enums.JobType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type")
    @Builder.Default
    private JobType jobType = JobType.HTTP;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String method;

    @Column(columnDefinition = "text")
    private String payload;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    @Column(columnDefinition = "text")
    private String result;

    @Column(columnDefinition = "text")
    private String timetableJson;

    @Builder.Default
    private Integer retries = 0;

    @Column(name = "max_retries")
    @Builder.Default
    private Integer maxRetries = 3;

    @Column(name = "retry_delay")
    @Builder.Default
    private Integer retryDelay = 30;

    @Column(name = "next_run")
    private LocalDateTime nextRun;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    private boolean recurring;

    @Column(name = "interval_minutes")
    private Long intervalMinutes;

    @Column(name = "ends_at")
    private LocalDateTime endsAt;

    @Column(name = "max_runs")
    private Integer maxRuns;

    @Column(name = "runs_count")
    @Builder.Default
    private Integer runsCount = 0;

    @Column(name = "consecutive_failures")
    @Builder.Default
    private Integer consecutiveFailures = 0;

    @Column(name = "max_consecutive_failures")
    private Integer maxConsecutiveFailures;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (retries == null) retries = 0;
        if (maxRetries == null) maxRetries = 3;
        if (retryDelay == null) retryDelay = 30;
        if (runsCount == null) runsCount = 0;
        if (consecutiveFailures == null) consecutiveFailures = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
