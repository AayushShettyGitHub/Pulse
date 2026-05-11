package com.example.backend.ai;

import com.example.backend.model.ChatMessage;
import com.example.backend.repository.ChatMessageRepository;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PersistentChatMemoryStore implements ChatMemoryStore {

    private final ChatMessageRepository repository;

    @Override
    public List<dev.langchain4j.data.message.ChatMessage> getMessages(Object memoryId) {
        UUID jobId = (UUID) memoryId;
        return repository.findByJobIdOrderByCreatedAtAsc(jobId).stream()
                .map(this::toLangChainMessage)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateMessages(Object memoryId, List<dev.langchain4j.data.message.ChatMessage> messages) {
        UUID jobId = (UUID) memoryId;
        // Simple strategy: Clear and re-save for the current window
        // In production, you might want to only save new messages
        repository.deleteByJobId(jobId);
        
        List<ChatMessage> entities = messages.stream()
                .map(m -> {
                    ChatMessage entity = new ChatMessage();
                    entity.setJobId(jobId);
                    entity.setContent(m.text());
                    entity.setRole(m.type().name());
                    return entity;
                })
                .collect(Collectors.toList());
        repository.saveAll(entities);
    }

    @Override
    @Transactional
    public void deleteMessages(Object memoryId) {
        repository.deleteByJobId((UUID) memoryId);
    }

    private dev.langchain4j.data.message.ChatMessage toLangChainMessage(ChatMessage entity) {
        return switch (entity.getRole()) {
            case "USER" -> UserMessage.from(entity.getContent());
            case "AI" -> AiMessage.from(entity.getContent());
            case "SYSTEM" -> SystemMessage.from(entity.getContent());
            default -> UserMessage.from(entity.getContent());
        };
    }
}
