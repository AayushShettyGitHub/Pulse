package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateJobRequest {
    @NotBlank
    private String url;
    private String method = "GET";
    private String payload;
    private Integer maxRetries = 3;

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public Integer getMaxRetries() { return maxRetries; }
    public void setMaxRetries(Integer maxRetries) { this.maxRetries = maxRetries; }
}
