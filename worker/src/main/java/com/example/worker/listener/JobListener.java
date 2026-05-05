package com.example.worker.listener;

import com.example.worker.config.RabbitMQConfig;
import com.example.worker.service.WorkerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class JobListener {

    private final WorkerService workerService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void receiveJob(String jobIdStr) {
        try {
            UUID jobId = UUID.fromString(jobIdStr);
            log.info("Received job from queue: {}", jobId);
            workerService.processJobById(jobId);
        } catch (Exception e) {
            log.error("Error processing job message: {}", e.getMessage());
            throw new org.springframework.amqp.AmqpRejectAndDontRequeueException(e);
        }
    }
}
