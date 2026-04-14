package com.example.backend.dto;

import com.example.backend.enums.JobStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public class JobResponse {
    private UUID id;
    private String name;
    private String jobType;
    private JobStatus status;
    private LocalDateTime createdAt;
    private String createdBy;
    private String result;
    private boolean recurring;
    private Long intervalMinutes;
    private LocalDateTime endsAt;
    private Integer maxRuns;
    private Integer runsCount;
    private LocalDateTime nextRun;
    private String url;
    private String method;
    private Integer consecutiveFailures;
    private Integer maxConsecutiveFailures;
    private String timetableJson;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getJobType() { return jobType; }
    public void setJobType(String jobType) { this.jobType = jobType; }
    public JobStatus getStatus() { return status; }
    public void setStatus(JobStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public boolean isRecurring() { return recurring; }
    public void setRecurring(boolean recurring) { this.recurring = recurring; }
    public Long getIntervalMinutes() { return intervalMinutes; }
    public void setIntervalMinutes(Long intervalMinutes) { this.intervalMinutes = intervalMinutes; }
    public LocalDateTime getEndsAt() { return endsAt; }
    public void setEndsAt(LocalDateTime endsAt) { this.endsAt = endsAt; }
    public Integer getMaxRuns() { return maxRuns; }
    public void setMaxRuns(Integer maxRuns) { this.maxRuns = maxRuns; }
    public Integer getRunsCount() { return runsCount; }
    public void setRunsCount(Integer runsCount) { this.runsCount = runsCount; }
    public LocalDateTime getNextRun() { return nextRun; }
    public void setNextRun(LocalDateTime nextRun) { this.nextRun = nextRun; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public Integer getConsecutiveFailures() { return consecutiveFailures; }
    public void setConsecutiveFailures(Integer consecutiveFailures) { this.consecutiveFailures = consecutiveFailures; }
    public Integer getMaxConsecutiveFailures() { return maxConsecutiveFailures; }
    public void setMaxConsecutiveFailures(Integer maxConsecutiveFailures) { this.maxConsecutiveFailures = maxConsecutiveFailures; }
    public String getTimetableJson() { return timetableJson; }
    public void setTimetableJson(String timetableJson) { this.timetableJson = timetableJson; }
}
