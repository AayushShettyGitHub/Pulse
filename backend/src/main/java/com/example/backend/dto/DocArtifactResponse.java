package com.example.backend.dto;

import com.example.backend.enums.DocArtifactStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocArtifactResponse {
    private UUID id;
    private UUID jobId;
    private String title;
    private String fileName;
    private String markdownContent;
    private DocArtifactStatus status;
    private LocalDateTime createdAt;
}
