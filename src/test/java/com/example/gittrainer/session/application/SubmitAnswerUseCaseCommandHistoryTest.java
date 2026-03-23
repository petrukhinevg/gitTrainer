package com.example.gittrainer.session.application;

import com.example.gittrainer.progress.application.ProgressRepository;
import com.example.gittrainer.progress.domain.ScenarioAttemptOutcome;
import com.example.gittrainer.progress.domain.ScenarioAttemptStart;
import com.example.gittrainer.progress.domain.ScenarioCompletionEvent;
import com.example.gittrainer.progress.domain.ScenarioProgressRecord;
import com.example.gittrainer.session.domain.RetryGuidance;
import com.example.gittrainer.session.domain.SessionState;
import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.session.domain.TrainingSession;
import com.example.gittrainer.session.infrastructure.FixtureRetryFeedbackCatalog;
import com.example.gittrainer.session.infrastructure.InMemorySessionRepository;
import com.example.gittrainer.session.infrastructure.InMemorySessionSubmissionRepository;
import com.example.gittrainer.session.infrastructure.RetryFeedbackFixtureSource;
import com.example.gittrainer.validation.application.SubmissionAnswerValidator;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import com.example.gittrainer.validation.domain.SubmissionValidationResult;
import com.example.gittrainer.validation.infrastructure.InMemoryValidationRunRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SubmitAnswerUseCaseCommandHistoryTest {

    @Test
    @SuppressWarnings("unchecked")
    void passesPriorSessionSubmissionsToValidator() {
        InMemorySessionRepository sessionRepository = new InMemorySessionRepository();
        InMemorySessionSubmissionRepository submissionRepository = new InMemorySessionSubmissionRepository();
        InMemoryValidationRunRepository validationRunRepository = new InMemoryValidationRunRepository();
        ProgressRepository progressRepository = new NoOpProgressRepository();
        SubmissionAnswerValidator validator = mock(SubmissionAnswerValidator.class);
        RetryGuidanceResolver retryGuidanceResolver = new RetryGuidanceResolver(
                new FixtureRetryFeedbackCatalog(new RetryFeedbackFixtureSource())
        );
        SubmitAnswerUseCase useCase = new SubmitAnswerUseCase(
                sessionRepository,
                submissionRepository,
                fixedIdentityGenerator(),
                validator,
                validationRunRepository,
                progressRepository,
                retryGuidanceResolver
        );
        sessionRepository.save(new TrainingSession(
                "session-1",
                "status-basics",
                "Status basics",
                "fixture",
                Instant.parse("2026-03-24T00:00:00Z"),
                SessionState.ACTIVE,
                0,
                0,
                null
        ));
        when(validator.validate(eq("session-1"), eq("status-basics"), anyList(), any())).thenReturn(
                SubmissionValidationResult.evaluated(
                        "spec-1",
                        "exact_command_match",
                        "in-process-fixture",
                        1,
                        SubmissionOutcome.correct("expected-command", "ok")
                )
        );

        useCase.submit("session-1", new SubmitAnswerCommand("command_text", "git status"));
        useCase.submit("session-1", new SubmitAnswerCommand("command_text", "git status --short"));

        ArgumentCaptor<List<SubmittedAnswer>> priorAnswersCaptor = ArgumentCaptor.forClass(List.class);
        verify(validator, times(2)).validate(eq("session-1"), eq("status-basics"), priorAnswersCaptor.capture(), any());
        List<List<SubmittedAnswer>> capturedPriorAnswers = priorAnswersCaptor.getAllValues();

        assertThat(capturedPriorAnswers.get(0)).isEmpty();
        assertThat(capturedPriorAnswers.get(1))
                .containsExactly(new SubmittedAnswer("command_text", "git status"));
    }

    private SessionIdentityGenerator fixedIdentityGenerator() {
        return new SessionIdentityGenerator() {
            private int submissionCounter;
            private int validationCounter;

            @Override
            public String nextSessionId() {
                return "unused-session-id";
            }

            @Override
            public String nextSubmissionId() {
                submissionCounter += 1;
                return "submission-" + submissionCounter;
            }

            @Override
            public String nextValidationRunId() {
                validationCounter += 1;
                return "validation-" + validationCounter;
            }
        };
    }

    private static final class NoOpProgressRepository implements ProgressRepository {

        @Override
        public ScenarioProgressRecord recordAttemptStart(ScenarioAttemptStart attemptStart) {
            return null;
        }

        @Override
        public ScenarioProgressRecord recordAttemptOutcome(ScenarioAttemptOutcome attemptOutcome) {
            return null;
        }

        @Override
        public Optional<ScenarioProgressRecord> findByScenarioSlug(String scenarioSlug) {
            return Optional.empty();
        }

        @Override
        public List<ScenarioProgressRecord> findAll() {
            return List.of();
        }

        @Override
        public List<ScenarioCompletionEvent> findCompletionEvents() {
            return List.of();
        }
    }
}
