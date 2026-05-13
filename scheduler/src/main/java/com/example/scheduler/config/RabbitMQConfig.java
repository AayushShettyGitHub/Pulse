package com.example.scheduler.config;

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
    public org.springframework.amqp.support.converter.MessageConverter messageConverter() {
        return new org.springframework.amqp.support.converter.Jackson2JsonMessageConverter();
    }
}
