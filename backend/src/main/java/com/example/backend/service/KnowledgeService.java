package com.example.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.backend.model.KnowledgeMetadata;
import com.example.backend.repository.KnowledgeMetadataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class KnowledgeService {

    private final Cloudinary cloudinary;
    private final KnowledgeMetadataRepository knowledgeRepository;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    public KnowledgeMetadata uploadDocument(MultipartFile file, UUID jobId) {
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), 
                ObjectUtils.asMap("resource_type", "auto"));
            
            String url = (String) uploadResult.get("secure_url");
            String fileName = file.getOriginalFilename();

            KnowledgeMetadata metadata = new KnowledgeMetadata();
            metadata.setJobId(jobId);
            metadata.setFileName(fileName);
            metadata.setSourceUrl(url);
            metadata.setStatus(com.example.backend.enums.KnowledgeStatus.PENDING);
            
            KnowledgeMetadata saved = knowledgeRepository.save(metadata);

            com.example.backend.dto.ProcessDocumentRequest request = new com.example.backend.dto.ProcessDocumentRequest(
                jobId,
                saved.getId(),
                url,
                fileName
            );

            rabbitTemplate.convertAndSend(
                com.example.backend.config.RabbitMQConfig.EXCHANGE_NAME,
                com.example.backend.config.RabbitMQConfig.DOCUMENT_ROUTING_KEY,
                request
            );

            return saved;
        } catch (Exception e) {
            log.error("Failed to upload document to Cloudinary", e);
            throw new RuntimeException("Upload failed", e);
        }
    }

    public KnowledgeMetadata ingestTextDocument(UUID jobId, String fileName, String sourceUrl, String textContent) {
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    textContent.getBytes(StandardCharsets.UTF_8),
                    ObjectUtils.asMap("resource_type", "raw", "public_id", fileName.replaceAll("[^a-zA-Z0-9-_]+", "_"))
            );

            String url = (String) uploadResult.get("secure_url");

            KnowledgeMetadata metadata = new KnowledgeMetadata();
            metadata.setJobId(jobId);
            metadata.setFileName(fileName);
            metadata.setSourceUrl(sourceUrl != null && !sourceUrl.isBlank() ? sourceUrl : url);
            metadata.setStatus(com.example.backend.enums.KnowledgeStatus.PENDING);

            KnowledgeMetadata saved = knowledgeRepository.save(metadata);

            com.example.backend.dto.ProcessDocumentRequest request = new com.example.backend.dto.ProcessDocumentRequest(
                    jobId,
                    saved.getId(),
                    url,
                    fileName
            );

            rabbitTemplate.convertAndSend(
                    com.example.backend.config.RabbitMQConfig.EXCHANGE_NAME,
                    com.example.backend.config.RabbitMQConfig.DOCUMENT_ROUTING_KEY,
                    request
            );

            return saved;
        } catch (Exception e) {
            log.error("Failed to ingest text document into Knowledge Base", e);
            throw new RuntimeException("Repo ingest failed", e);
        }
    }

    public List<KnowledgeMetadata> getKnowledgeByJob(UUID jobId) {
        return knowledgeRepository.findByJobId(jobId);
    }

    public void deleteDocument(UUID documentId) {
        knowledgeRepository.deleteById(documentId);
        log.info("Deleted knowledge document: {}", documentId);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteByJobId(UUID jobId) {
        knowledgeRepository.deleteByJobId(jobId);
        log.info("Deleted all knowledge documents for job: {}", jobId);
    }
}
