package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.ScenarioValidationEngine;
import com.example.gittrainer.validation.application.ScenarioValidationSpecSource;
import com.example.gittrainer.validation.application.SubmissionAnswerValidator;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Primary
@Component
@Profile("!test & !local-memory")
@ConditionalOnProperty(
        prefix = "gittrainer.validator.cli",
        name = "enabled",
        havingValue = "false",
        matchIfMissing = true
)
public class PostgresSubmissionAnswerValidator implements SubmissionAnswerValidator {

    private final ScenarioValidationSpecSource specSource;

    public PostgresSubmissionAnswerValidator(ScenarioValidationSpecSource specSource) {
        this.specSource = specSource;
    }

    @Override
    public SubmissionOutcome validate(String scenarioSlug, SubmittedAnswer answer) {
        if (!"command_text".equals(answer.type())) {
            return ScenarioValidationEngine.unsupportedAnswerType();
        }

        return specSource.findSpec(scenarioSlug, answer.type())
                .map(spec -> ScenarioValidationEngine.validate(spec, answer))
                .orElseGet(ScenarioValidationEngine::missingRule);
    }
}
