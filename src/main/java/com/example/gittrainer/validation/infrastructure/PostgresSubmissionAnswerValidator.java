package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.SubmissionAnswerValidator;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Primary
@Component
@Profile("!test & !local-memory")
public class PostgresSubmissionAnswerValidator implements SubmissionAnswerValidator {

    private final JdbcClient jdbcClient;

    public PostgresSubmissionAnswerValidator(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    @Override
    public SubmissionOutcome validate(String scenarioSlug, SubmittedAnswer answer) {
        if (!"command_text".equals(answer.type())) {
            return SubmissionOutcome.unsupported(
                    "unsupported-answer-type",
                    "Сейчас проверяются только ответы в виде команды."
            );
        }

        String normalizedAnswer = FixtureSubmissionRuleLoader.normalizeCommand(answer.value());
        return jdbcClient.sql("""
                        SELECT outcome_correctness,
                               outcome_code,
                               outcome_message
                        FROM authored_scenario_answers
                        WHERE scenario_slug = ?
                          AND answer_type = ?
                          AND normalized_answer_value = ?
                        LIMIT 1
                        """)
                .params(scenarioSlug, answer.type(), normalizedAnswer)
                .query((resultSet, rowNum) -> new PersistedOutcome(
                        resultSet.getString("outcome_correctness"),
                        resultSet.getString("outcome_code"),
                        resultSet.getString("outcome_message")
                ))
                .optional()
                .map(this::toOutcome)
                .orElseGet(() -> fallbackOutcome(scenarioSlug, answer.type()));
    }

    private SubmissionOutcome fallbackOutcome(String scenarioSlug, String answerType) {
        Long ruleCount = jdbcClient.sql("""
                        SELECT COUNT(*)
                        FROM authored_scenario_answers
                        WHERE scenario_slug = ?
                          AND answer_type = ?
                        """)
                .params(scenarioSlug, answerType)
                .query(Long.class)
                .single();

        if (ruleCount == null || ruleCount == 0) {
            return SubmissionOutcome.incorrect(
                    "validation-rule-missing",
                    "Для активного сценария пока нет правила валидации."
            );
        }

        return SubmissionOutcome.incorrect(
                "unexpected-command",
                "Отправленная команда не совпадает с ожидаемым безопасным следующим шагом для этого сценария."
        );
    }

    private SubmissionOutcome toOutcome(PersistedOutcome persistedOutcome) {
        return switch (persistedOutcome.correctness()) {
            case "correct" -> SubmissionOutcome.correct(
                    persistedOutcome.code(),
                    persistedOutcome.message()
            );
            case "unsupported" -> SubmissionOutcome.unsupported(
                    persistedOutcome.code(),
                    persistedOutcome.message()
            );
            default -> SubmissionOutcome.incorrect(
                    persistedOutcome.code(),
                    persistedOutcome.message()
            );
        };
    }

    private record PersistedOutcome(
            String correctness,
            String code,
            String message
    ) {
    }
}
