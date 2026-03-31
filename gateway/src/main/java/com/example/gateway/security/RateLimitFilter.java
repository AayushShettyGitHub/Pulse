package com.example.gateway.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Component
public class RateLimitFilter implements GlobalFilter, Ordered {

    private final int requestsPerMinute;

    public RateLimitFilter(@Value("${rate-limit.requests-per-minute:60}") int requestsPerMinute) {
        this.requestsPerMinute = requestsPerMinute;
    }

    private static class RequestTracker {
        private final ConcurrentLinkedQueue<Long> timestamps = new ConcurrentLinkedQueue<>();

        boolean allowRequest(int limit) {
            long now = System.currentTimeMillis();
            long oneMinuteAgo = now - 60000;

            while (!timestamps.isEmpty() && timestamps.peek() < oneMinuteAgo) {
                timestamps.poll();
            }

            if (timestamps.size() >= limit) {
                return false;
            }

            timestamps.add(now);
            return true;
        }
    }

    private final ConcurrentHashMap<String, RequestTracker> requestTrackers = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        
        // Skip rate limiting for public endpoints
        if (path.startsWith("/gateway/api/auth") || path.startsWith("/gateway/health")) {
            return chain.filter(exchange);
        }

        String key = getClientIdentifier(exchange);
        RequestTracker tracker = requestTrackers.computeIfAbsent(key, k -> new RequestTracker());

        if (!tracker.allowRequest(requestsPerMinute)) {
            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            exchange.getResponse().getHeaders().add("Retry-After", "60");
            return exchange.getResponse().setComplete();
        }

        return chain.filter(exchange);
    }

    private String getClientIdentifier(ServerWebExchange exchange) {
        // Try to get user ID from header first (set by AuthenticationFilter if it runs first)
        String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
        if (userId != null && !userId.isEmpty()) {
            return "user:" + userId;
        }

        // Fall back to client IP
        String clientIp = exchange.getRequest().getRemoteAddress() != null 
            ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
            : "unknown";
        return "ip:" + clientIp;
    }

    @Override
    public int getOrder() {
        return -90; // Run after AuthenticationFilter (-100)
    }
}


