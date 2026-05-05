package com.example.worker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcessDocumentRequest {
    private UUID jobId;
    private UUID metadataId;
    private String sourceUrl;
    private String fileName;
}
