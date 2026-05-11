package com.example.backend.service;

import com.example.backend.ai.PersistentChatMemoryStore;
import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.MemoryId;
import dev.langchain4j.service.Result;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.store.embedding.pinecone.PineconeEmbeddingStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatService {

    private final PersistentChatMemoryStore chatMemoryStore;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${pinecone.api.key:}")
    private String pineconeApiKey;

    @Value("${pinecone.index:}")
    private String pineconeIndex;

    @Value("${ai.service.url:http://localhost:8000/embed}")
    private String aiServiceUrl;

    interface Assistant {
        Result<String> chat(@MemoryId UUID jobId, @UserMessage String userMessage);
    }

    public String askQuestion(UUID jobId, String query) {
        try {
            PineconeEmbeddingStore embeddingStore = PineconeEmbeddingStore.builder()
                    .apiKey(pineconeApiKey)
                    .index(pineconeIndex)
                    .nameSpace(jobId.toString())
                    .build();

            EmbeddingModel embeddingModel = new com.example.backend.ai.LocalEmbeddingModel(aiServiceUrl);

            ContentRetriever contentRetriever = EmbeddingStoreContentRetriever.builder()
                    .embeddingStore(embeddingStore)
                    .embeddingModel(embeddingModel)
                    .maxResults(5)
                    .build();

            OpenAiChatModel chatModel = OpenAiChatModel.builder()
                    .apiKey(groqApiKey)
                    .baseUrl("https://api.groq.com/openai/v1")
                    .modelName("llama-3.1-8b-instant")
                    .build();

            Assistant assistant = AiServices.builder(Assistant.class)
                    .chatLanguageModel(chatModel)
                    .contentRetriever(contentRetriever)
                    .chatMemoryProvider(memoryId -> MessageWindowChatMemory.builder()
                            .id(memoryId)
                            .maxMessages(20)
                            .chatMemoryStore(chatMemoryStore)
                            .build())
                    .build();

            Result<String> result = assistant.chat(jobId, query);
            
            String answer = result.content();
            
            // Extract unique source file names
            String sources = result.sources().stream()
                .map(content -> content.textSegment().metadata().getString("fileName"))
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.joining(", "));

            if (!sources.isEmpty()) {
                answer += "\n\n**Sources:** " + sources;
            }

            return answer;
        } catch (Exception e) {
            log.error("RAG query failed", e);
            return "Error: " + e.getMessage();
        }
    }
}
