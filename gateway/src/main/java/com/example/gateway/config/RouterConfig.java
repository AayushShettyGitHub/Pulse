package com.example.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;
import com.example.gateway.handler.GatewayApiHandler;

import static org.springframework.web.reactive.function.server.RequestPredicates.*;

@Configuration
public class RouterConfig {

    @Bean
    public RouterFunction<ServerResponse> gatewayRoutes(WebClient webClient, GatewayApiHandler apiHandler) {
        return RouterFunctions
                .route(POST("/gateway/api/auth/login"), apiHandler::login)
                .andRoute(POST("/gateway/api/auth/logout"), apiHandler::logout)
                .andRoute(GET("/gateway/health"), apiHandler::health);

    }
}
