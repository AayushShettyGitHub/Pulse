package com.example.worker.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    @Value("${resend.api.key}")
    private String apiKey;

    @Value("${resend.sender.email}")
    private String senderEmail;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendEmail(String to, String subject, String htmlContent) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("from", "Pulse Monitor <" + senderEmail + ">");
            body.put("to", new String[]{to});
            body.put("subject", subject);
            body.put("html", htmlContent);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            restTemplate.postForEntity("https://api.resend.com/emails", entity, String.class);
        } catch (Exception e) {
            log.error("Failed to send email alert: {}", e.getMessage());
        }
    }
}
