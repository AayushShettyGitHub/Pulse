package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateJobRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String url;
    private String method = "GET";
    private String payload;
    private Integer maxRetries = 3;
    private String jobType = "HTTP";
    private String timetableJson;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getJobType() { return jobType; }
    public void setJobType(String jobType) { this.jobType = jobType; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public Integer getMaxRetries() { return maxRetries; }
    public void setMaxRetries(Integer maxRetries) { this.maxRetries = maxRetries; }

    private boolean recurring = false;
    private Long intervalMinutes;
    private java.time.LocalDateTime endsAt;
    private Integer maxRuns;
    private java.time.LocalDateTime startTime;
    private Integer maxConsecutiveFailures = 5;

    public boolean isRecurring() { return recurring; }
    public void setRecurring(boolean recurring) { this.recurring = recurring; }
    public Long getIntervalMinutes() { return intervalMinutes; }
    public void setIntervalMinutes(Long intervalMinutes) { this.intervalMinutes = intervalMinutes; }
    public java.time.LocalDateTime getEndsAt() { return endsAt; }
    public void setEndsAt(java.time.LocalDateTime endsAt) { this.endsAt = endsAt; }
    public Integer getMaxRuns() { return maxRuns; }
    public void setMaxRuns(Integer maxRuns) { this.maxRuns = maxRuns; }
    public java.time.LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(java.time.LocalDateTime startTime) { this.startTime = startTime; }
    public Integer getMaxConsecutiveFailures() { return maxConsecutiveFailures; }
    public void setMaxConsecutiveFailures(Integer maxConsecutiveFailures) { this.maxConsecutiveFailures = maxConsecutiveFailures; }
    public String getTimetableJson() { return timetableJson; }
    public void setTimetableJson(String timetableJson) { this.timetableJson = timetableJson; }
}
