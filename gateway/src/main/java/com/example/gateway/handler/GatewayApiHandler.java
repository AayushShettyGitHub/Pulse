package com.example.gateway.handler;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.ClientResponse;
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
        String query = request.uri().getQuery();
        String url = BACKEND_URL + request.path() + (query != null ? "?" + query : "");

        WebClient.RequestBodySpec bodySpec = webClient
                .method(request.method())
                .uri(url)
                .headers(headers -> {
                    request.headers().asHttpHeaders().forEach((key, values) -> {
                        if (!key.equalsIgnoreCase("Host") && !key.equalsIgnoreCase("Connection")) {
                            headers.addAll(key, values);
                        }
                    });
                });

        WebClient.RequestHeadersSpec<?> headersSpec = bodySpec;

        if (request.method().name().equalsIgnoreCase("POST") || 
            request.method().name().equalsIgnoreCase("PUT") || 
            request.method().name().equalsIgnoreCase("PATCH")) {
            headersSpec = bodySpec.body(BodyInserters.fromPublisher(request.bodyToMono(String.class), String.class));
        }

        return headersSpec
                .exchangeToMono((ClientResponse response) -> ServerResponse
                        .status(response.statusCode())
                        .headers(headers -> response.headers().asHttpHeaders().forEach((key, values) -> {
                            if (!key.equalsIgnoreCase("Content-Length")) {
                                headers.addAll(key, values);
                            }
                        }))
                        .body(response.bodyToMono(String.class), String.class))
                .onErrorResume(e -> ServerResponse
                        .status(502)
                        .bodyValue("Bad Gateway: " + e.getMessage()));
    }
}
