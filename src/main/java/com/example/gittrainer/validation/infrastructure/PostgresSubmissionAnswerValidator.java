package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.ScenarioValidationEngine;
import com.example.gittrainer.validation.application.ScenarioValidationSpecSource;
import com.example.gittrainer.validation.application.SubmissionAnswerValidator;
import com.example.gittrainer.validation.cli.CliValidationRequest;
import com.example.gittrainer.validation.domain.SubmissionValidationResult;
import com.example.gittrainer.session.application.SessionWorkspaceManager;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;

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

    private static final long NANOS_PER_MILLISECOND = 1_000_000L;
    private static final String RUNNER_KIND = "in-process-postgres";
    private final ScenarioValidationSpecSource specSource;
    private final SessionWorkspaceManager sessionWorkspaceManager;

    public PostgresSubmissionAnswerValidator(
            ScenarioValidationSpecSource specSource,
            SessionWorkspaceManager sessionWorkspaceManager
    ) {
        this.specSource = specSource;
        this.sessionWorkspaceManager = sessionWorkspaceManager;
    }

    @Override
    public SubmissionValidationResult validate(
            String sessionId,
            String scenarioSlug,
            List<SubmittedAnswer> priorAnswers,
            SubmittedAnswer answer
    ) {
        long startedAt = System.nanoTime();
        if (!"command_text".equals(answer.type())) {
            return SubmissionValidationResult.evaluated(
                    null,
                    null,
                    RUNNER_KIND,
                    elapsedMillis(startedAt),
                    ScenarioValidationEngine.unsupportedAnswerType()
            );
        }

        return specSource.findSpec(scenarioSlug, answer.type())
                .map(spec -> SubmissionValidationResult.evaluated(
                        spec.specId(),
                        spec.validatorType(),
                        RUNNER_KIND,
                        elapsedMillis(startedAt),
                        ValidationOutcomeMapper.outcome(
                                spec,
                                new CliValidationRequest(
                                        scenarioSlug,
                                        priorAnswers,
                                        answer,
                                        spec,
                                        sessionWorkspaceManager.resolveWorkspacePath(sessionId)
                                                .map(java.nio.file.Path::toString)
                                                .orElse(null)
                                )
                        )
                ))
                .orElseGet(() -> SubmissionValidationResult.evaluated(
                        null,
                        null,
                        RUNNER_KIND,
                        elapsedMillis(startedAt),
                        ScenarioValidationEngine.missingRule()
                ));
    }

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / NANOS_PER_MILLISECOND;
    }
}
