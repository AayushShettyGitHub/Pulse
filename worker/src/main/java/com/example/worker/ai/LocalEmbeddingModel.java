package com.example.worker.ai;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import lombok.RequiredArgsConstructor;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class LocalEmbeddingModel implements EmbeddingModel {

    private final String aiServiceUrl;
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    @SuppressWarnings("unchecked")
    public Response<List<Embedding>> embedAll(List<TextSegment> textSegments) {
        List<String> texts = textSegments.stream()
                .map(TextSegment::text)
                .collect(Collectors.toList());

        Map<String, Object> request = new HashMap<>();
        request.put("texts", texts);

        List<List<Double>> vectors = (List<List<Double>>) restTemplate.postForObject(aiServiceUrl, request, List.class);

        List<Embedding> embeddings = vectors.stream()
                .map(vector -> {
                    List<Float> floatVector = vector.stream()
                            .map(n -> ((Number) n).floatValue())
                            .collect(Collectors.toList());
                    return Embedding.from(floatVector);
                })
                .collect(Collectors.toList());

        return Response.from(embeddings);
    }
}
