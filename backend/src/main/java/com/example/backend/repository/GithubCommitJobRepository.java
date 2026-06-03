package com.example.backend.repository;

import com.example.backend.model.GithubCommitJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GithubCommitJobRepository extends JpaRepository<GithubCommitJob, UUID> {
    List<GithubCommitJob> findByRepoIdOrderByCreatedAtDesc(UUID repoId);
}
