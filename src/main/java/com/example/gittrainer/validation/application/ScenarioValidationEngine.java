package com.example.gittrainer.validation.application;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.domain.SubmissionOutcome;

public final class ScenarioValidationEngine {

    private static final String EXACT_COMMAND_MATCH = "exact_command_match";
    private static final String GIT_COMMAND_PROBE = "git_command_probe";
    private static final String GIT_REPO_STATE_PROBE = "git_repo_state_probe";
    private static final String EXACT_NORMALIZED_COMMAND = "exact_normalized_command";

    private ScenarioValidationEngine() {
    }

    public static SubmissionOutcome validate(ScenarioValidationSpec spec, SubmittedAnswer answer) {
        if (!EXACT_COMMAND_MATCH.equals(spec.validatorType())
                && !GIT_COMMAND_PROBE.equals(spec.validatorType())
                && !GIT_REPO_STATE_PROBE.equals(spec.validatorType())) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-unsupported-spec",
                    "CLI validator пока не поддерживает тип проверки: " + spec.validatorType()
            );
        }
        boolean unsupportedRuleType = spec.rules().stream()
                .map(ScenarioValidationRule::matchType)
                .anyMatch(matchType -> !EXACT_NORMALIZED_COMMAND.equals(matchType));
        if (unsupportedRuleType) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-unsupported-rule",
                    "CLI validator пока не поддерживает тип match rule в validator spec."
            );
        }

        String normalizedAnswer = CommandTextNormalizer.normalize(answer.value());
        return spec.rules().stream()
                .filter(rule -> EXACT_NORMALIZED_COMMAND.equals(rule.matchType()))
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
            case "partial" -> SubmissionOutcome.partial(rule.code(), rule.message());
            case "unsupported" -> SubmissionOutcome.unsupported(rule.code(), rule.message());
            default -> SubmissionOutcome.incorrect(rule.code(), rule.message());
        };
    }
}
