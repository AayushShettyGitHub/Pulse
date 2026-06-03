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
public class DocGenerationJobResponse {
    private UUID id;
    private String repoName;
    private String repoUrl;
    private String commitSha;
    private String commitMessage;
    private String prNumber;
    private String branchName;
    private String diffSummary;
    private String previousContext;
    private String currentContext;
    private DocArtifactStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
