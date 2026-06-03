package com.example.backend.dto;

import lombok.Data;

@Data
public class GithubRepositoryRequest {
    private String repoUrl;
    private String repoName;
    private String owner;
    private String defaultBranch;
    private String authType;
    private String accessToken;
    private Long installationId;
}
