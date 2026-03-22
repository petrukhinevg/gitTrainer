package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.validation.application.CommandTextNormalizer;
import com.example.gittrainer.validation.application.ScenarioValidationRule;
import com.example.gittrainer.validation.application.ScenarioValidationSpec;
import com.example.gittrainer.validation.application.ScenarioValidationSpecSource;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@Profile("test | local-memory")
public class FixtureScenarioValidationSpecSource implements ScenarioValidationSpecSource {

    private static final long DEFAULT_VALIDATOR_TIMEOUT_MS = 5_000L;
    private static final Map<String, List<String>> RULES = FixtureSubmissionRuleLoader.loadRules();

    @Override
    public Optional<ScenarioValidationSpec> findSpec(String scenarioSlug, String answerType) {
        List<String> commands = RULES.get(scenarioSlug);
        if (commands == null) {
            return Optional.empty();
        }

        List<ScenarioValidationRule> rules = commands.stream()
                .map(command -> new ScenarioValidationRule(
                        "exact_normalized_command",
                        command,
                        CommandTextNormalizer.normalize(command),
                        "correct",
                        "expected-command",
                        "Отправленная команда совпадает с ожидаемым безопасным следующим шагом для этого сценария."
                ))
                .toList();

        return Optional.of(new ScenarioValidationSpec(
                "fixture:" + scenarioSlug + ":" + answerType,
                scenarioSlug,
                answerType,
                "exact_command_match",
                DEFAULT_VALIDATOR_TIMEOUT_MS,
                rules
        ));
    }
}
