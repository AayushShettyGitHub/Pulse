package com.example.worker.controller;

import com.example.worker.service.WorkerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/worker")
@RequiredArgsConstructor
public class WorkerController {

    private final WorkerService workerService;

    @GetMapping("/status")
    public ResponseEntity<String> getStatus() {
        return ResponseEntity.ok("Worker is active and listening to queue...");
    }

    @PostMapping("/run/{id}")
    public ResponseEntity<String> triggerJob(@PathVariable UUID id) {
        workerService.processJobById(id);
        return ResponseEntity.ok("Job execution triggered for ID: " + id);
    }
}
