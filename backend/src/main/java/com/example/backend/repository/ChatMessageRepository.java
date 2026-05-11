package com.example.backend.repository;

import com.example.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByJobIdOrderByCreatedAtAsc(UUID jobId);
    void deleteByJobId(UUID jobId);
}
