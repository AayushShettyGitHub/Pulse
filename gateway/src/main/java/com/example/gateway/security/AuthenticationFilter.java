package com.example.gateway.security;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;
    private final com.example.gateway.repository.UserRepository userRepository;

    public AuthenticationFilter(JwtUtil jwtUtil, com.example.gateway.repository.UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // Always allow CORS preflight OPTIONS requests
        if (exchange.getRequest().getMethod() == HttpMethod.OPTIONS) {
            return chain.filter(exchange);
        }

        if (path.startsWith("/api/auth") || path.startsWith("/gateway/health")) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || authHeader.isEmpty()) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = null;
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        if (!jwtUtil.validateToken(token)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String username = jwtUtil.extractUsername(token);
        
        // check if user exists in DB
        return Mono.fromCallable(() -> userRepository.findByUsername(username))
                .subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic())
                .flatMap(userOpt -> {
                    if (userOpt.isEmpty()) {
                        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                        return exchange.getResponse().setComplete();
                    }
                    
                    // Add username to request headers for downstream services
                    ServerWebExchange modifiedExchange = exchange.mutate()
                            .request(exchange.getRequest().mutate()
                                    .header("X-User-Id", username)
                                    .build())
                            .build();

                    return chain.filter(modifiedExchange);
                });
    }

    @Override
    public int getOrder() {
        return -100; // Run early
    }
}
