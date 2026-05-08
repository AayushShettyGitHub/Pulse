
package com.example.worker.listener;

import com.example.worker.config.RabbitMQConfig;
import com.example.worker.enums.JobStatus;
import com.example.worker.enums.KnowledgeStatus;
import com.example.worker.repository.JobRepository;
import com.example.worker.repository.KnowledgeMetadataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class DlqListener {

    private final JobRepository jobRepository;
    private final KnowledgeMetadataRepository knowledgeRepository;

    @RabbitListener(queues = RabbitMQConfig.DLQ_NAME)
    public void processFailedJobMessages(org.springframework.amqp.core.Message message) {
        String payload = new String(message.getBody());
        log.error("CRITICAL: Job message routed to DLQ. Payload: {}", payload);
        
        try {
            UUID jobId = UUID.fromString(payload);
            jobRepository.findById(jobId).ifPresent(job -> {
                job.setStatus(JobStatus.FAILED);
                job.setResult("System Error: Job dead-lettered due to unrecoverable processing failure.");
                jobRepository.save(job);
                log.info("Marked dead-lettered job {} as FAILED in database.", jobId);
            });
        } catch (Exception e) {
            log.error("Could not parse or update dead-lettered job: {}", e.getMessage());
        }
    }

    @RabbitListener(queues = RabbitMQConfig.DOCUMENT_DLQ_NAME)
    public void processFailedDocumentMessages(org.springframework.amqp.core.Message message) {
        String payload = new String(message.getBody());
        log.error("CRITICAL: Document message routed to DLQ. Payload: {}", payload);

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(payload);

            if (node.has("metadataId")) {
                UUID metadataId = UUID.fromString(node.get("metadataId").asText());
                knowledgeRepository.findById(metadataId).ifPresent(meta -> {
                    meta.setStatus(KnowledgeStatus.FAILED);
                    knowledgeRepository.save(meta);
                    log.info("Marked dead-lettered document {} as FAILED.", metadataId);
                });
            }
        } catch (Exception e) {
            log.error("Could not parse or update dead-lettered document: {}", e.getMessage());
        }
    }
}

