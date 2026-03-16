package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.SubmissionAnswerValidator;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class FixtureSubmissionAnswerValidator implements SubmissionAnswerValidator {

    private static final Map<String, Set<String>> SUPPORTED_COMMANDS_BY_SCENARIO = loadFixtureRules();

    @Override
    public SubmissionOutcome validate(String scenarioSlug, SubmittedAnswer answer) {
        if (!"command_text".equals(answer.type())) {
            return SubmissionOutcome.unsupported(
                    "unsupported-answer-type",
                    "This MVP validation slice only evaluates command_text answers."
            );
        }

        Set<String> acceptedCommands = SUPPORTED_COMMANDS_BY_SCENARIO.get(scenarioSlug);
        if (acceptedCommands == null) {
            return SubmissionOutcome.incorrect(
                    "validation-rule-missing",
                    "No validation rule is available for the active scenario yet."
            );
        }

        String normalizedAnswer = normalizeCommand(answer.value());
        if (acceptedCommands.contains(normalizedAnswer)) {
            return SubmissionOutcome.correct(
                    "expected-command",
                    "Submitted command matches the expected safe next action for this scenario."
            );
        }

        return SubmissionOutcome.incorrect(
                "unexpected-command",
                "Submitted command does not match the expected safe next action for this scenario."
        );
    }

    private String normalizeCommand(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    private static Map<String, Set<String>> loadFixtureRules() {
        JsonParser jsonParser = JsonParserFactory.getJsonParser();

        try (var inputStream = new ClassPathResource("session/fixture-submission-rules.json").getInputStream()) {
            String rawJson = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            Map<String, Object> parsedRules = jsonParser.parseMap(rawJson);

            return parsedRules.entrySet().stream()
                    .collect(Collectors.toUnmodifiableMap(
                            Map.Entry::getKey,
                            entry -> ((java.util.List<?>) entry.getValue()).stream()
                                    .map(String::valueOf)
                                    .map(FixtureSubmissionAnswerValidator::normalizeCommandStatic)
                                    .collect(Collectors.toUnmodifiableSet())
                    ));
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to load shared fixture submission rules.", exception);
        }
    }

    private static String normalizeCommandStatic(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toLowerCase();
    }
}
