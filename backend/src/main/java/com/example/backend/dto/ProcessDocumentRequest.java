package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcessDocumentRequest implements Serializable {
    private UUID jobId;
    private UUID metadataId;
    private String sourceUrl;
    private String fileName;
}
