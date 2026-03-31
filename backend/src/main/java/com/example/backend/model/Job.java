package com.example.backend.model;

import com.example.backend.enums.JobStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Job {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String method;

    @Column(columnDefinition = "text")
    private String payload;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    private Integer retries;

    private Integer maxRetries;

    private LocalDateTime nextRun;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String createdBy;
}
