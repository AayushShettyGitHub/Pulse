package com.example.gateway.handler;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import com.example.gateway.security.JwtUtil;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Component
public class GatewayApiHandler {
    private final JwtUtil jwtUtil;
    private static final String BACKEND_URL = "http://localhost:8082";

    public GatewayApiHandler(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    public Mono<ServerResponse> login(ServerRequest request) {
        String username = request.queryParam("username").orElse("user");
        String token = jwtUtil.generateToken(username);
        
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("type", "Bearer");
        response.put("expiresIn", "3600");
        
        return ServerResponse.ok().bodyValue(response);
    }

    public Mono<ServerResponse> logout(ServerRequest request) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logout successful");
        return ServerResponse.ok().bodyValue(response);
    }

    public Mono<ServerResponse> health(ServerRequest request) {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "API Gateway");
        return ServerResponse.ok().bodyValue(response);
    }

    public Mono<ServerResponse> proxyBackend(ServerRequest request, WebClient webClient) {
        String path = request.path().replaceFirst("/api", "");
        String url = BACKEND_URL + path;
        
        String authHeader = request.headers().firstHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ServerResponse.status(401).bodyValue("Unauthorized");
        }

        String token = authHeader.substring(7);
        String username = jwtUtil.extractUsername(token);
        
        if (username == null) {
            return ServerResponse.status(401).bodyValue("Invalid token");
        }

        return webClient
                .method(request.method())
                .uri(url)
                .header("X-User-Id", username)
                .headers(headers -> {
                    request.headers().asHttpHeaders().forEach((key, values) -> {
                        if (!key.equalsIgnoreCase("Host") && !key.equalsIgnoreCase("Connection")) {
                            headers.addAll(key, values);
                        }
                    });
                })
                .body(BodyInserters.fromPublisher(request.bodyToMono(String.class), String.class))
                .retrieve()
                .toEntity(String.class)
                .flatMap(response -> ServerResponse
                        .status(response.getStatusCode())
                        .headers(headers -> response.getHeaders().forEach((key, values) -> {
                            if (!key.equalsIgnoreCase("Content-Length")) {
                                headers.addAll(key, values);
                            }
                        }))
                        .bodyValue(response.getBody() != null ? response.getBody() : ""))
                .onErrorResume(e -> ServerResponse
                        .status(502)
                        .bodyValue("Bad Gateway: " + e.getMessage()));
    }
}
