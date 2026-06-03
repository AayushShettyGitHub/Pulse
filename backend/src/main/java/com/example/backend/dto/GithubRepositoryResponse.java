package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GithubRepositoryResponse {
    private UUID id;
    private String repoUrl;
    private String repoName;
    private String owner;
    private String defaultBranch;
    private String authType;
    private Long installationId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
