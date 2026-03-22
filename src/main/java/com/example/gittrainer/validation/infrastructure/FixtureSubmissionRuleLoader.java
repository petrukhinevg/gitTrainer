package com.example.gittrainer.validation.infrastructure;

import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public final class FixtureSubmissionRuleLoader {

    private FixtureSubmissionRuleLoader() {
    }

    public static Map<String, List<String>> loadRules() {
        JsonParser jsonParser = JsonParserFactory.getJsonParser();

        try (var inputStream = new ClassPathResource(
                "session/fixture-submission-rules.json"
        ).getInputStream()) {
            String rawJson = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            Map<String, Object> parsedRules = jsonParser.parseMap(rawJson);

            return parsedRules.entrySet().stream()
                    .collect(Collectors.toUnmodifiableMap(
                            Map.Entry::getKey,
                            entry -> ((List<?>) entry.getValue()).stream()
                                    .map(String::valueOf)
                                    .toList()
                    ));
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Не удалось загрузить общие fixture-правила для отправки ответа.",
                    exception
            );
        }
    }

    public static String normalizeCommand(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toLowerCase();
    }
}
