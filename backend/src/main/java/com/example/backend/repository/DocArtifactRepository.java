package com.example.backend.repository;

import com.example.backend.model.DocArtifact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocArtifactRepository extends JpaRepository<DocArtifact, UUID> {
    List<DocArtifact> findByJobIdOrderByCreatedAtDesc(UUID jobId);
}
