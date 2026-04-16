package com.example.worker.strategy;

import com.example.worker.model.Job;
import com.example.worker.model.JobExecution;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class HealthCheckExecutor implements JobExecutor {
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public boolean execute(Job job, JobExecution execution) {
        try {
            long pingStart = System.currentTimeMillis();
            ResponseEntity<String> response = restTemplate.exchange(job.getUrl(), HttpMethod.GET, null, String.class);
            long responseTimeMs = System.currentTimeMillis() - pingStart;
            
            execution.setResponseTimeMs(responseTimeMs);
            execution.setStatusCode(response.getStatusCode().value());
            execution.setResult("HTTP " + response.getStatusCode().value() + " | " + responseTimeMs + "ms");
            
            job.setResult(execution.getResult());
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            execution.setResult("DOWN: " + e.getMessage());
            execution.setStatusCode(0);
            job.setResult(execution.getResult());
            return false;
        }
    }
}
