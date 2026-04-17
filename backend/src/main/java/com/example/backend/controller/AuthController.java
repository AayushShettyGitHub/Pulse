package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;
import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.LoginRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("USER");
        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();

        return userRepository.findByUsername(username)
                .filter(user -> passwordEncoder.matches(password, user.getPassword()))
                .map(user -> {
                    String token = jwtUtil.generateToken(user.getUsername());
                    String json = String.format("{\"token\":\"%s\",\"username\":\"%s\"}", token, user.getUsername());
                    return ResponseEntity.ok()
                            .header("Content-Type", "application/json")
                            .header("X-Debug-Backend", "AuthController")
                            .body(json);
                })
                .orElse(ResponseEntity.status(401).body("Invalid credentials"));
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validate(@RequestParam String token) {
        if (jwtUtil.validateToken(token)) {
            String username = jwtUtil.extractUsername(token);
            return ResponseEntity.ok(Map.of("valid", true, "username", username));
        }
        return ResponseEntity.status(401).body(Map.of("valid", false));
    }
}
