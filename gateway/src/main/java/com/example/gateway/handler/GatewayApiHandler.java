package com.example.gateway.handler;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Component
public class GatewayApiHandler {
    private final String backendUrl;

    public GatewayApiHandler(@Value("${backend.url}") String backendUrl) {
        this.backendUrl = backendUrl;
    }

    public Mono<ServerResponse> health(ServerRequest request) {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "API Gateway");
        response.put("backend", backendUrl);
        return ServerResponse.ok().bodyValue(response);
    }
}
