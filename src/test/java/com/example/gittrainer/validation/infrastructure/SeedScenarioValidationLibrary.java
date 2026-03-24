package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.validation.application.ScenarioValidationRule;
import com.example.gittrainer.validation.application.ScenarioValidationSpec;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public final class SeedScenarioValidationLibrary {

    public static final long DEFAULT_VALIDATOR_TIMEOUT_MS = 5_000L;

    private static final String COMMAND_TEXT = "command_text";
    private static final SeedScenarioValidationResourceLoader RESOURCE_LOADER =
            new SeedScenarioValidationResourceLoader();

    private SeedScenarioValidationLibrary() {
    }

    public static Optional<SeedScenarioValidationDefinition> findDefinition(String scenarioSlug) {
        return RESOURCE_LOADER.findDefinition(scenarioSlug);
    }

    public static Optional<ScenarioValidationSpec> findSpec(String specNamespace, String scenarioSlug, String answerType) {
        if (!COMMAND_TEXT.equals(answerType)) {
            return Optional.empty();
        }
        return findDefinition(scenarioSlug)
                .map(definition -> definition.toSpec(specId(specNamespace, scenarioSlug, answerType), answerType));
    }

    public static Map<String, List<String>> acceptedAnswersByScenario() {
        return RESOURCE_LOADER.definitions().entrySet().stream()
                .collect(Collectors.toUnmodifiableMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().acceptedAnswers()
                ));
    }

    public static List<String> correctAnswersFor(String scenarioSlug) {
        return findDefinition(scenarioSlug)
                .map(SeedScenarioValidationDefinition::correctAnswers)
                .orElse(List.of());
    }

    private static String specId(String specNamespace, String scenarioSlug, String answerType) {
        return specNamespace + ":" + scenarioSlug + ":" + answerType;
    }

    public record SeedScenarioValidationDefinition(
            String scenarioSlug,
            String validatorType,
            Map<String, Object> config,
            List<ScenarioValidationRule> rules
    ) {

        public SeedScenarioValidationDefinition {
            config = Map.copyOf(config);
            rules = List.copyOf(rules);
        }

        public ScenarioValidationSpec toSpec(String specId, String answerType) {
            return new ScenarioValidationSpec(
                    specId,
                    scenarioSlug,
                    answerType,
                    validatorType,
                    DEFAULT_VALIDATOR_TIMEOUT_MS,
                    config,
                    rules
            );
        }

        public List<String> acceptedAnswers() {
            return rules.stream()
                    .map(ScenarioValidationRule::rawMatchValue)
                    .toList();
        }

        public List<String> correctAnswers() {
            return rules.stream()
                    .filter(rule -> "correct".equals(rule.correctness()))
                    .map(ScenarioValidationRule::rawMatchValue)
                    .toList();
        }
    }
}
