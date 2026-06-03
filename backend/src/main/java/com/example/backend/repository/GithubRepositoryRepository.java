package com.example.backend.repository;

import com.example.backend.model.GithubRepository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface GithubRepositoryRepository extends JpaRepository<GithubRepository, UUID> {
}
