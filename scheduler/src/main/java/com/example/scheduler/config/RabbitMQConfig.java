package com.example.scheduler.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMQConfig {
    @Bean
    public Queue jobQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-max-priority", 10);
        return new Queue("jobQueue", true, false, false, args);
    }
}
