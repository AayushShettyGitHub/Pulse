package com.example.backend.repository;

import com.example.backend.model.KnowledgeMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KnowledgeMetadataRepository extends JpaRepository<KnowledgeMetadata, UUID> {
    List<KnowledgeMetadata> findByJobId(UUID jobId);
    List<KnowledgeMetadata> findByJobIdAndStatus(UUID jobId, com.example.backend.enums.KnowledgeStatus status);
}
