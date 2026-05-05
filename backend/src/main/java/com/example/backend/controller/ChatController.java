package com.example.backend.controller;

import com.example.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/{jobId}")
    public ResponseEntity<String> askQuestion(
            @PathVariable UUID jobId,
            @RequestBody String query) {
        return ResponseEntity.ok(chatService.askQuestion(jobId, query));
    }
}
