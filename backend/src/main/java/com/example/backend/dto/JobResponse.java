package com.example.backend.dto;

import com.example.backend.enums.JobStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public class JobResponse {
    private UUID id;
    private JobStatus status;
    private LocalDateTime createdAt;
    private String createdBy;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public JobStatus getStatus() { return status; }
    public void setStatus(JobStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
