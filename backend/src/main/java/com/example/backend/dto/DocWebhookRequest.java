package com.example.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class DocWebhookRequest {
    private String repoName;
    private String repoUrl;
    private String commitSha;
    private String commitMessage;
    private String prNumber;
    private String branchName;
    private List<String> changedFiles;
    private String diffSummary;
    private String triggerType;
}
