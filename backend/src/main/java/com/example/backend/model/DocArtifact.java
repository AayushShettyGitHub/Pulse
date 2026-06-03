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
@Table(name = "doc_artifacts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocArtifact {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @Column(nullable = false)
    private String title;

    @Column(name = "markdown_content", columnDefinition = "text", nullable = false)
    private String markdownContent;

    @Column(name = "file_name")
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocArtifactStatus status = DocArtifactStatus.COMPLETED;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = DocArtifactStatus.COMPLETED;
    }
}
