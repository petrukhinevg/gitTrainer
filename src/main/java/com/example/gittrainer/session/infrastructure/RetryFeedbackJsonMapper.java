package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.RetryExplanationTemplate;
import com.example.gittrainer.session.application.RetryHintTemplate;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class RetryFeedbackJsonMapper {

    private final ObjectMapper objectMapper = JsonMapper.builder()
            .findAndAddModules()
            .build();

    public RetryFeedbackJsonMapper() {
    }

    public String writeValue(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Не удалось сериализовать retry feedback payload.", exception);
        }
    }

    public RetryExplanationTemplate readExplanationTemplate(String rawJson) {
        try {
            return objectMapper.readValue(rawJson, RetryExplanationTemplate.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Не удалось десериализовать explanation template.", exception);
        }
    }

    public RetryHintTemplate readHintTemplate(String rawJson) {
        try {
            return objectMapper.readValue(rawJson, RetryHintTemplate.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Не удалось десериализовать hint template.", exception);
        }
    }
}
