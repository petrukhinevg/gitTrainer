package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.SubmissionAnswerValidator;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Profile("test | local-memory")
public class FixtureSubmissionAnswerValidator implements SubmissionAnswerValidator {

    private static final Map<String, Set<String>> SUPPORTED_COMMANDS_BY_SCENARIO =
            FixtureSubmissionRuleLoader.loadRules().entrySet().stream()
                    .collect(Collectors.toUnmodifiableMap(
                            Map.Entry::getKey,
                            entry -> entry.getValue().stream()
                                    .map(FixtureSubmissionRuleLoader::normalizeCommand)
                                    .collect(Collectors.toUnmodifiableSet())
                    ));

    @Override
    public SubmissionOutcome validate(String scenarioSlug, SubmittedAnswer answer) {
        if (!"command_text".equals(answer.type())) {
            return SubmissionOutcome.unsupported(
                    "unsupported-answer-type",
                    "Сейчас проверяются только ответы в виде команды."
            );
        }

        Set<String> acceptedCommands = SUPPORTED_COMMANDS_BY_SCENARIO.get(scenarioSlug);
        if (acceptedCommands == null) {
            return SubmissionOutcome.incorrect(
                    "validation-rule-missing",
                    "Для активного сценария пока нет правила валидации."
            );
        }

        String normalizedAnswer = normalizeCommand(answer.value());
        if (acceptedCommands.contains(normalizedAnswer)) {
            return SubmissionOutcome.correct(
                    "expected-command",
                    "Отправленная команда совпадает с ожидаемым безопасным следующим шагом для этого сценария."
            );
        }

        return SubmissionOutcome.incorrect(
                "unexpected-command",
                "Отправленная команда не совпадает с ожидаемым безопасным следующим шагом для этого сценария."
        );
    }

    private String normalizeCommand(String value) {
        return FixtureSubmissionRuleLoader.normalizeCommand(value);
    }
}
