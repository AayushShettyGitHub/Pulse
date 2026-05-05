
package com.example.worker.listener;

import com.example.worker.config.RabbitMQConfig;
import com.example.worker.enums.JobStatus;
import com.example.worker.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class DlqListener {

    private final JobRepository jobRepository;

    @RabbitListener(queues = RabbitMQConfig.DLQ_NAME)
    public void processFailedMessages(org.springframework.amqp.core.Message message) {
        String payload = new String(message.getBody());
        log.error("CRITICAL: Message routed to DLQ. Payload: {}", payload);
        
        try {
            UUID jobId = UUID.fromString(payload);
            jobRepository.findById(jobId).ifPresent(job -> {
                job.setStatus(JobStatus.FAILED);
                job.setResult("System Error: Job dead-lettered due to unrecoverable processing failure.");
                jobRepository.save(job);
                log.info("Marked dead-lettered job {} as FAILED in database.", jobId);
            });
        } catch (Exception e) {
            log.error("Could not parse or update dead-lettered job. Payload might be corrupted: {}", e.getMessage());
        }
    }
}
