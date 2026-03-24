package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioTaskContent;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Profile("!test")
class ScenarioPayloadJsonMapper {

    private final ObjectMapper objectMapper = JsonMapper.builder()
            .findAndAddModules()
            .build();

    String writeValue(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Не удалось сериализовать payload сценария.", exception);
        }
    }

    List<String> readTags(String rawJson) {
        try {
            return objectMapper.readValue(rawJson, new TypeReference<List<String>>() {
            });
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Не удалось десериализовать список тегов сценария.", exception);
        }
    }

    ScenarioTaskContent readTaskContent(String rawJson) {
        try {
            return objectMapper.readValue(rawJson, ScenarioTaskContent.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Не удалось десериализовать payload задания сценария.", exception);
        }
    }

    ScenarioWorkspaceDetail.ScenarioRepositoryContext readRepositoryContext(String rawJson) {
        try {
            return objectMapper.readValue(rawJson, ScenarioWorkspaceDetail.ScenarioRepositoryContext.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(
                    "Не удалось десериализовать контекст репозитория сценария.",
                    exception
            );
        }
    }
}
