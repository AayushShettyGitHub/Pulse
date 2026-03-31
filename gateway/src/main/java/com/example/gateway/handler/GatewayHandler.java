package com.example.gateway.handler;

import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

public class GatewayHandler {
    private final WebClient webClient;
    private static final String BACKEND_URL = "http://localhost:8082";

    public GatewayHandler(WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<ServerResponse> proxyBackend(ServerRequest request) {
        String path = request.path().replaceFirst("/api", "");
        String url = BACKEND_URL + path;

        return webClient
                .method(request.method())
                .uri(url)
                .headers(headers -> headers.addAll(request.headers().asHttpHeaders()))
                .body(BodyInserters.fromPublisher(request.bodyToMono(String.class), String.class))
                .retrieve()
                .toEntity(String.class)
                .flatMap(response -> ServerResponse
                        .status(response.getStatusCode())
                        .headers(headers -> headers.addAll(response.getHeaders()))
                        .bodyValue(response.getBody() != null ? response.getBody() : ""))
                .onErrorResume(e -> ServerResponse
                        .status(502)
                        .bodyValue("Bad Gateway: " + e.getMessage()));
    }
}
