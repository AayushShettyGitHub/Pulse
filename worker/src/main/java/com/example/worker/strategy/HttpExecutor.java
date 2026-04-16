package com.example.worker.strategy;

import com.example.worker.model.Job;
import com.example.worker.model.JobExecution;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class HttpExecutor implements JobExecutor {
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public boolean execute(Job job, JobExecution execution) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(job.getPayload(), headers);
            HttpMethod method = HttpMethod.valueOf(job.getMethod().toUpperCase());

            ResponseEntity<String> response = restTemplate.exchange(job.getUrl(), method, entity, String.class);
            execution.setStatusCode(response.getStatusCode().value());
            execution.setResult(response.getBody() == null || response.getBody().isBlank() 
                ? "HTTP " + response.getStatusCode() 
                : response.getBody());
            
            job.setResult(execution.getResult());
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            execution.setResult("Error: " + e.getMessage());
            job.setResult(execution.getResult());
            return false;
        }
    }
}
