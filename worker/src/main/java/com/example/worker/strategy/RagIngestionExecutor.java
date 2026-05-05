package com.example.worker.strategy;

import com.example.worker.config.RabbitMQConfig;
import com.example.worker.dto.ProcessDocumentRequest;
import com.example.worker.enums.KnowledgeStatus;
import com.example.worker.model.Job;
import com.example.worker.model.JobExecution;
import com.example.worker.model.KnowledgeMetadata;
import com.example.worker.repository.KnowledgeMetadataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.nio.file.Path;

@Component
@Slf4j
@RequiredArgsConstructor
public class RagIngestionExecutor implements JobExecutor {

    private final KnowledgeMetadataRepository knowledgeRepository;
    private final RabbitTemplate rabbitTemplate;

    @Override
    public boolean execute(Job job, JobExecution execution) {
        log.info("Starting RAG Discovery for job: {}", job.getName());
        
        try {
            Path folderPath = java.nio.file.Paths.get(job.getUrl());
            if (!java.nio.file.Files.exists(folderPath) || !java.nio.file.Files.isDirectory(folderPath)) {
                execution.setResult("Discovery Error: Source path is not a valid directory: " + job.getUrl());
                return false;
            }

            java.util.List<java.nio.file.Path> files = java.nio.file.Files.list(folderPath)
                    .filter(java.nio.file.Files::isRegularFile)
                    .toList();

            int queuedCount = 0;
            int skippedCount = 0;

            for (java.nio.file.Path filePath : files) {
                String fileName = filePath.getFileName().toString();
                String currentHash = com.example.worker.util.HashUtil.calculateChecksum(filePath);
                
                java.util.Optional<KnowledgeMetadata> existingMeta = knowledgeRepository.findByJobId(job.getId())
                        .stream()
                        .filter(m -> m.getFileName().equals(fileName))
                        .findFirst();

                boolean needsProcessing = false;
                KnowledgeMetadata meta;

                if (existingMeta.isEmpty()) {
                    meta = new KnowledgeMetadata();
                    meta.setJobId(job.getId());
                    meta.setFileName(fileName);
                    meta.setSourceUrl(filePath.toAbsolutePath().toString());
                    meta.setContentHash(currentHash);
                    meta.setStatus(KnowledgeStatus.PENDING);
                    knowledgeRepository.save(meta);
                    needsProcessing = true;
                    log.info("New document discovered: {}", fileName);
                } else {
                    meta = existingMeta.get();
                    if (!currentHash.equals(meta.getContentHash()) || meta.getStatus() == KnowledgeStatus.FAILED) {
                        meta.setContentHash(currentHash);
                        meta.setStatus(KnowledgeStatus.PENDING);
                        meta.setSourceUrl(filePath.toAbsolutePath().toString());
                        knowledgeRepository.save(meta);
                        needsProcessing = true;
                        log.info("Change detected in document: {}", fileName);
                    } else {
                        skippedCount++;
                    }
                }

                if (needsProcessing) {
                    ProcessDocumentRequest request = new ProcessDocumentRequest(
                        job.getId(),
                        meta.getId(),
                        meta.getSourceUrl(),
                        meta.getFileName()
                    );
                    
                    rabbitTemplate.convertAndSend(
                        RabbitMQConfig.EXCHANGE_NAME,
                        RabbitMQConfig.DOCUMENT_ROUTING_KEY,
                        request
                    );
                    queuedCount++;
                }
            }

            String result = String.format("Discovery complete. Queued: %d, Skipped: %d (unchanged).", queuedCount, skippedCount);
            log.info(result);
            execution.setResult(result);
            return true;

        } catch (Exception e) {
            log.error("RAG Discovery failed for job: {}", job.getId(), e);
            execution.setResult("Discovery Error: " + e.getMessage());
            return false;
        }
    }
}
