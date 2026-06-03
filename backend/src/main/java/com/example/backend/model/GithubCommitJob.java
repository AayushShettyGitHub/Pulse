package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "github_commit_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GithubCommitJob {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "repo_id", nullable = false)
    private UUID repoId;

    @Column(name = "commit_sha", nullable = false)
    private String commitSha;

    @Column(name = "commit_message", columnDefinition = "text")
    private String commitMessage;

    @Column(name = "changed_files", columnDefinition = "text")
    private String changedFiles;

    @Column(name = "status")
    private String status = "READY";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "READY";
    }
}
