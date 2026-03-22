package com.example.gittrainer.validation.application;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.domain.SubmissionOutcome;

public final class ScenarioValidationEngine {

    private static final String EXACT_COMMAND_MATCH = "exact_command_match";

    private ScenarioValidationEngine() {
    }

    public static SubmissionOutcome validate(ScenarioValidationSpec spec, SubmittedAnswer answer) {
        if (!EXACT_COMMAND_MATCH.equals(spec.validatorType())) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-unsupported-spec",
                    "CLI validator пока не поддерживает тип проверки: " + spec.validatorType()
            );
        }

        String normalizedAnswer = CommandTextNormalizer.normalize(answer.value());
        return spec.rules().stream()
                .filter(rule -> rule.normalizedAnswerValue().equals(normalizedAnswer))
                .findFirst()
                .map(ScenarioValidationEngine::toOutcome)
                .orElseGet(ScenarioValidationEngine::unexpectedCommand);
    }

    public static SubmissionOutcome unsupportedAnswerType() {
        return SubmissionOutcome.unsupported(
                "unsupported-answer-type",
                "Сейчас проверяются только ответы в виде команды."
        );
    }

    public static SubmissionOutcome missingRule() {
        return SubmissionOutcome.incorrect(
                "validation-rule-missing",
                "Для активного сценария пока нет правила валидации."
        );
    }

    public static SubmissionOutcome unexpectedCommand() {
        return SubmissionOutcome.incorrect(
                "unexpected-command",
                "Отправленная команда не совпадает с ожидаемым безопасным следующим шагом для этого сценария."
        );
    }

    private static SubmissionOutcome toOutcome(ScenarioValidationRule rule) {
        return switch (rule.correctness()) {
            case "correct" -> SubmissionOutcome.correct(rule.code(), rule.message());
            case "unsupported" -> SubmissionOutcome.unsupported(rule.code(), rule.message());
            default -> SubmissionOutcome.incorrect(rule.code(), rule.message());
        };
    }
}
