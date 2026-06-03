package com.example.backend.model;

import com.example.backend.enums.DocArtifactStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "doc_generation_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocGenerationJob {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "repo_name", nullable = false)
    private String repoName;

    @Column(name = "repo_url")
    private String repoUrl;

    @Column(name = "commit_sha", nullable = false)
    private String commitSha;

    @Column(name = "commit_message", columnDefinition = "text")
    private String commitMessage;

    @Column(name = "pr_number")
    private String prNumber;

    @Column(name = "branch_name")
    private String branchName;

    @Column(name = "changed_files", columnDefinition = "text")
    private String changedFiles;

    @Column(name = "diff_summary", columnDefinition = "text")
    private String diffSummary;

    @Column(name = "previous_context", columnDefinition = "text")
    private String previousContext;

    @Column(name = "current_context", columnDefinition = "text")
    private String currentContext;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocArtifactStatus status = DocArtifactStatus.PENDING;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = DocArtifactStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
