package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "github_repositories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GithubRepository {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "repo_url", nullable = false)
    private String repoUrl;

    @Column(name = "repo_name", nullable = false)
    private String repoName;

    @Column(name = "owner")
    private String owner;

    @Column(name = "default_branch")
    private String defaultBranch = "main";

    @Column(name = "auth_type")
    private String authType = "GITHUB_APP";

    @Column(name = "installation_id")
    private Long installationId;

    @Column(name = "access_token", columnDefinition = "text")
    private String accessToken;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
