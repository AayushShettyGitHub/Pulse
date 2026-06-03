package com.example.backend.repository;

import com.example.backend.model.DocGenerationJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocGenerationJobRepository extends JpaRepository<DocGenerationJob, UUID> {
    List<DocGenerationJob> findByRepoNameOrderByCreatedAtDesc(String repoName);
}
