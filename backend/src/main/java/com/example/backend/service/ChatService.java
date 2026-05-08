package com.example.backend.service;

import dev.langchain4j.chain.ConversationalRetrievalChain;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
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

        @Value("${pinecone.index:}")
        private String pineconeIndex;

        @Value("${ai.service.url:http://localhost:8000/embed}")
        private String aiServiceUrl;

        public String askQuestion(UUID jobId, String query) {
                try {
                        PineconeEmbeddingStore embeddingStore = PineconeEmbeddingStore.builder()
                                        .apiKey(pineconeApiKey)
                                        .index(pineconeIndex)
                                        .build();

                        EmbeddingModel embeddingModel = new com.example.backend.ai.LocalEmbeddingModel(aiServiceUrl);

                        ContentRetriever contentRetriever = EmbeddingStoreContentRetriever.builder()
                                        .embeddingStore(embeddingStore)
                                        .embeddingModel(embeddingModel)
                                        .maxResults(10)
                                        .build();

                        OpenAiChatModel chatModel = OpenAiChatModel.builder()
                                        .apiKey(groqApiKey)
                                        .baseUrl("https://api.groq.com/openai/v1")
                                        .modelName("llama-3.1-8b-instant")
                                        .build();

                        ConversationalRetrievalChain chain = ConversationalRetrievalChain.builder()
                                        .chatLanguageModel(chatModel)
                                        .contentRetriever(contentRetriever)
                                        .build();

                        String instructions = "Instructions: Provide accurate information based ONLY on the provided context.\n"
                                        +
                                        "- Do not mix features between different projects.\n" +
                                        "- Use clean Markdown formatting.\n\nQuery: ";

                        return chain.execute(instructions + query);
                } catch (Exception e) {
                        log.error("RAG query failed", e);
                        return "Error: " + e.getMessage();
                }
        }
}
