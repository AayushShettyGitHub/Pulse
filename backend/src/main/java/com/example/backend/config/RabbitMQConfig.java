package com.example.backend.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMQConfig {

    public static final String QUEUE_NAME = "jobQueue";
    public static final String DLQ_NAME = "jobQueue.dlq";
    public static final String EXCHANGE_NAME = "pulseExchange";
    public static final String DOCUMENT_ROUTING_KEY = "document.routing.key";

    @Bean
    public Queue jobQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-max-priority", 10);
        args.put("x-dead-letter-exchange", "");
        args.put("x-dead-letter-routing-key", DLQ_NAME);
        return new Queue(QUEUE_NAME, true, false, false, args);
    }
}
