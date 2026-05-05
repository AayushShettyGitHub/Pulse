package com.example.backend.service;

import dev.langchain4j.chain.ConversationalRetrievalChain;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.retriever.EmbeddingStoreRetriever;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.pinecone.PineconeEmbeddingStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@Slf4j
public class ChatService {

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${pinecone.api.key:}")
    private String pineconeApiKey;

    @Value("${pinecone.environment:}")
    private String pineconeEnvironment;

    @Value("${pinecone.index:}")
    private String pineconeIndex;

    @Value("${ai.service.url:http://localhost:8000/embed}")
    private String aiServiceUrl;

    public String askQuestion(UUID jobId, String query) {
        try {
            EmbeddingStore<TextSegment> embeddingStore = PineconeEmbeddingStore.builder()
                    .apiKey(pineconeApiKey)
                    .environment(pineconeEnvironment)
                    .index(pineconeIndex)
                    .build();

            EmbeddingModel embeddingModel = new com.example.backend.ai.LocalEmbeddingModel(aiServiceUrl);

            EmbeddingStoreRetriever retriever = EmbeddingStoreRetriever.from(
                    embeddingStore,
                    embeddingModel,
                    10
            );

            OpenAiChatModel chatModel = OpenAiChatModel.builder()
                    .apiKey(groqApiKey)
                    .baseUrl("https://api.groq.com/openai/v1")
                    .modelName("llama3-8b-8192")
                    .build();

            ConversationalRetrievalChain chain = ConversationalRetrievalChain.builder()
                    .chatLanguageModel(chatModel)
                    .retriever(retriever)
                    .build();

            return chain.execute(query);
        } catch (Exception e) {
            log.error("RAG query failed", e);
            return "Error: " + e.getMessage();
        }
    }
}
