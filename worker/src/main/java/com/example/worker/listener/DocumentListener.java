package com.example.worker.listener;

import com.example.worker.config.RabbitMQConfig;
import com.example.worker.dto.ProcessDocumentRequest;
import com.example.worker.enums.KnowledgeStatus;
import com.example.worker.model.KnowledgeMetadata;
import com.example.worker.repository.KnowledgeMetadataRepository;
import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentParser;
import dev.langchain4j.data.document.DocumentSplitter;
import dev.langchain4j.data.document.loader.FileSystemDocumentLoader;
import dev.langchain4j.data.document.parser.apache.tika.ApacheTikaDocumentParser;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.pinecone.PineconeEmbeddingStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class DocumentListener {

    private final KnowledgeMetadataRepository knowledgeRepository;

    @Value("${pinecone.api.key:}")
    private String pineconeApiKey;

    @Value("${pinecone.environment:}")
    private String pineconeEnvironment;

    @Value("${pinecone.index:}")
    private String pineconeIndex;

    @Value("${pinecone.project-name:}")
    private String pineconeProjectName;

    @Value("${pinecone.host:}")
    private String pineconeHost;

    @Value("${ai.service.url:http://localhost:8000/embed}")
    private String aiServiceUrl;

    @RabbitListener(queues = RabbitMQConfig.DOCUMENT_QUEUE_NAME)
    public void processDocument(ProcessDocumentRequest request) {
        log.info("Processing document: {} for job: {}", request.getFileName(), request.getJobId());

        KnowledgeMetadata meta = knowledgeRepository.findById(request.getMetadataId()).orElse(null);
        if (meta == null) {
            log.error("Metadata not found for ID: {}", request.getMetadataId());
            return;
        }

        try {
            EmbeddingModel embeddingModel = new com.example.worker.ai.LocalEmbeddingModel(aiServiceUrl);

            PineconeEmbeddingStore embeddingStore = PineconeEmbeddingStore.builder()
                    .apiKey(pineconeApiKey)
                    .index(pineconeIndex)
                    .environment(pineconeEnvironment)
                    .projectId(pineconeProjectName)
                    .build();

            DocumentParser parser = new ApacheTikaDocumentParser();
            Document document;

            if (request.getSourceUrl().startsWith("http")) {
                log.info("Downloading document from URL: {}", request.getSourceUrl());
                java.net.URL url = URI.create(request.getSourceUrl()).toURL();
                try (java.io.InputStream in = url.openStream()) {
                    document = parser.parse(in);
                }
            } else {
                Path path = Paths.get(request.getSourceUrl());
                if (!Files.exists(path)) {
                    throw new RuntimeException("File not found at path: " + request.getSourceUrl());
                }
                document = FileSystemDocumentLoader.loadDocument(path, parser);
            }

            document.metadata().put("jobId", request.getJobId().toString());
            document.metadata().put("fileName", request.getFileName());

            DocumentSplitter splitter = DocumentSplitters.recursive(300, 30);
            List<TextSegment> segments = splitter.split(document);

            log.info("Generating embeddings for {} segments...", segments.size());
            List<Embedding> embeddings = embeddingModel.embedAll(segments).content();

            embeddingStore.addAll(embeddings, segments);

            if (!request.getSourceUrl().startsWith("http")) {
                log.info("Cleaning up transient storage for file: {}", request.getFileName());
                Files.deleteIfExists(Paths.get(request.getSourceUrl()));
            }

            meta.setStatus(KnowledgeStatus.INDEXED);
            meta.setLastIndexedAt(LocalDateTime.now());
            knowledgeRepository.save(meta);

            log.info("Successfully indexed and purged document: {}", request.getFileName());

        } catch (Exception e) {
            log.error("Failed to process document: {}", request.getFileName(), e);
            meta.setStatus(KnowledgeStatus.FAILED);
            knowledgeRepository.save(meta);
        }
    }
}
