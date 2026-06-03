package com.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GitHubAppService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${github.app.id:}")
    private String appId;

    @Value("${github.app.private-key-path:}")
    private String privateKeyPath;

    @Value("${github.webhook.secret:}")
    private String webhookSecret;

    @Value("${github.api.base-url:https://api.github.com}")
    private String githubApiBaseUrl;

    public boolean verifyWebhookSignature(String payload, String signatureHeader) {
        if (webhookSecret == null || webhookSecret.isBlank() || signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        try {
            String expected = "sha256=" + hmacSha256Hex(webhookSecret, payload);
            return constantTimeEquals(expected, signatureHeader);
        } catch (Exception e) {
            return false;
        }
    }

    public String createAppJwt() {
        try {
            String header = base64Url("{\"alg\":\"RS256\",\"typ\":\"JWT\"}");
            long now = Instant.now().getEpochSecond();
            String payload = base64Url("""
                    {"iat":%d,"exp":%d,"iss":"%s"}
                    """.formatted(now - 60, now + 540, appId).replaceAll("\\s+", ""));
            String signingInput = header + "." + payload;
            byte[] signature = signWithPrivateKey(signingInput.getBytes(StandardCharsets.UTF_8));
            return signingInput + "." + base64Url(signature);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to create GitHub App JWT", e);
        }
    }

    public String getInstallationToken(long installationId) {
        try {
            String jwt = createAppJwt();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(githubApiBaseUrl + "/app/installations/" + installationId + "/access_tokens"))
                    .header("Authorization", "Bearer " + jwt)
                    .header("Accept", "application/vnd.github+json")
                    .header("X-GitHub-Api-Version", "2022-11-28")
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode json = objectMapper.readTree(response.body());
            return json.path("token").asText("");
        } catch (Exception e) {
            throw new IllegalStateException("Unable to get GitHub installation token", e);
        }
    }

    public String fetchCommitDiff(String owner, String repo, String sha, String token) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(githubApiBaseUrl + "/repos/" + owner + "/" + repo + "/commits/" + sha))
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", "application/vnd.github+json")
                    .header("X-GitHub-Api-Version", "2022-11-28")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode json = objectMapper.readTree(response.body());
            StringBuilder sb = new StringBuilder();
            JsonNode files = json.path("files");
            for (JsonNode file : files) {
                sb.append("File: ").append(file.path("filename").asText()).append("\n");
                sb.append("Status: ").append(file.path("status").asText()).append("\n");
                sb.append("Patch:\n").append(file.path("patch").asText("")).append("\n\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    public String fetchPullRequestContext(String owner, String repo, String prNumber, String token) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(githubApiBaseUrl + "/repos/" + owner + "/" + repo + "/pulls/" + prNumber))
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", "application/vnd.github+json")
                    .header("X-GitHub-Api-Version", "2022-11-28")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode json = objectMapper.readTree(response.body());
            return """
                    PR Title: %s
                    PR Body: %s
                    Base Branch: %s
                    Head Branch: %s
                    """.formatted(
                    json.path("title").asText(""),
                    json.path("body").asText(""),
                    json.path("base").path("ref").asText(""),
                    json.path("head").path("ref").asText("")
            );
        } catch (Exception e) {
            return "";
        }
    }

    public String fetchRepoReadme(String owner, String repo, String token) {
        try {
            return fetchRepoFile(owner, repo, "README.md", token);
        } catch (Exception e) {
            return "";
        }
    }

    public String fetchRepoFile(String owner, String repo, String path, String token) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(githubApiBaseUrl + "/repos/" + owner + "/" + repo + "/contents/" + path))
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", "application/vnd.github.raw")
                    .header("X-GitHub-Api-Version", "2022-11-28")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.body();
        } catch (Exception e) {
            return "";
        }
    }

    public String fetchRepoContext(String owner, String repo, String token) {
        Set<String> files = Set.of(
                "README.md",
                "ARCHITECTURE_SUMMARY.md",
                "IMPLEMENTATION_GUIDE.md",
                "INTERVIEW_PREP_GUIDE.md",
                "TESTING_GUIDE.md",
                "QUICK_REFERENCE.md"
        );

        return files.stream()
                .map(file -> {
                    String content = fetchRepoFile(owner, repo, file, token);
                    if (content == null || content.isBlank()) {
                        return "";
                    }
                    return """
                            --- %s ---
                            %s
                            """.formatted(file, content);
                })
                .filter(s -> !s.isBlank())
                .collect(Collectors.joining("\n"));
    }

    public String fetchRepoTreeSummary(String owner, String repo, String token) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(githubApiBaseUrl + "/repos/" + owner + "/" + repo + "/git/trees/HEAD?recursive=1"))
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", "application/vnd.github+json")
                    .header("X-GitHub-Api-Version", "2022-11-28")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode json = objectMapper.readTree(response.body());
            JsonNode tree = json.path("tree");
            StringBuilder sb = new StringBuilder();
            for (JsonNode node : tree) {
                String path = node.path("path").asText("");
                if (path.endsWith(".md") || path.endsWith(".json") || path.endsWith(".yml") || path.endsWith(".yaml") || path.endsWith(".java") || path.endsWith(".jsx") || path.endsWith(".js")) {
                    sb.append(path).append("\n");
                }
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private byte[] signWithPrivateKey(byte[] signingInput) throws Exception {
        String pem = Files.readString(Path.of(privateKeyPath));
        String sanitized = pem
                .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");
        byte[] keyBytes = Base64.getDecoder().decode(sanitized);
        java.security.KeyFactory keyFactory = java.security.KeyFactory.getInstance("RSA");
        java.security.spec.PKCS8EncodedKeySpec keySpec = new java.security.spec.PKCS8EncodedKeySpec(keyBytes);
        java.security.PrivateKey privateKey = keyFactory.generatePrivate(keySpec);
        java.security.Signature signature = java.security.Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(signingInput);
        return signature.sign();
    }

    private String hmacSha256Hex(String secret, String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : digest) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }

    private String base64Url(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }
}
