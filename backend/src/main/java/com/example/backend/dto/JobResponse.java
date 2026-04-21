package com.example.backend.dto;

import com.example.backend.enums.JobStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}