package com.example.worker.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMQConfig {

    public static final String QUEUE_NAME = "jobQueue";
    public static final String EXCHANGE_NAME = "pulseExchange";
    public static final String ROUTING_KEY = "job.routing.key";
    public static final String DLQ_NAME = "jobQueue.dlq";
    public static final String DOCUMENT_QUEUE_NAME = "documentQueue";
    public static final String DOCUMENT_ROUTING_KEY = "document.routing.key";

    @Bean
    public Queue jobQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-max-priority", 10);
        args.put("x-dead-letter-exchange", "");
        args.put("x-dead-letter-routing-key", DLQ_NAME);
        return new Queue(QUEUE_NAME, true, false, false, args);
    }

    @Bean
    public Queue deadLetterQueue() {
        return new Queue(DLQ_NAME, true);
    }

    @Bean
    public DirectExchange pulseExchange() {
        return new DirectExchange(EXCHANGE_NAME);
    }

    @Bean
    public Binding jobBinding(Queue jobQueue, DirectExchange pulseExchange) {
        return BindingBuilder.bind(jobQueue).to(pulseExchange).with(ROUTING_KEY);
    }

    @Bean
    public Queue documentQueue() {
        return new Queue(DOCUMENT_QUEUE_NAME, true);
    }

    @Bean
    public Binding documentBinding(Queue documentQueue, DirectExchange pulseExchange) {
        return BindingBuilder.bind(documentQueue).to(pulseExchange).with(DOCUMENT_ROUTING_KEY);
    }
}
