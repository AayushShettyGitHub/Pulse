package com.example.backend.controller;

import com.example.backend.model.KnowledgeMetadata;
import com.example.backend.service.KnowledgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    @PostMapping("/upload")
    public ResponseEntity<KnowledgeMetadata> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("jobId") UUID jobId) {
        return ResponseEntity.ok(knowledgeService.uploadDocument(file, jobId));
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<KnowledgeMetadata>> getKnowledgeByJob(@PathVariable UUID jobId) {
        return ResponseEntity.ok(knowledgeService.getKnowledgeByJob(jobId));
    }
}
