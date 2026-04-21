package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Getter 
@Setter
@NoArgsConstructor
@AllArgsConstructor
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
    private boolean recurring = false;
    private Long intervalMinutes;
    private LocalDateTime endsAt;
    private Integer maxRuns;
    private LocalDateTime startTime;
    private Integer maxConsecutiveFailures = 5;
}