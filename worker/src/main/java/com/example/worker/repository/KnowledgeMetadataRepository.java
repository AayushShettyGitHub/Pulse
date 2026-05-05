package com.example.worker.repository;

import com.example.worker.model.KnowledgeMetadata;
import com.example.worker.enums.KnowledgeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KnowledgeMetadataRepository extends JpaRepository<KnowledgeMetadata, UUID> {
    List<KnowledgeMetadata> findByJobId(UUID jobId);
    List<KnowledgeMetadata> findByJobIdAndStatus(UUID jobId, KnowledgeStatus status);
}
