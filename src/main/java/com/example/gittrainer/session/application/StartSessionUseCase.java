package com.example.gittrainer.session.application;

import com.example.gittrainer.progress.application.ProgressRepository;
import com.example.gittrainer.progress.domain.ScenarioAttemptStart;
import com.example.gittrainer.session.domain.RetryStatePolicy;
import com.example.gittrainer.session.domain.SessionState;
import com.example.gittrainer.session.domain.TrainingSession;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class StartSessionUseCase {

    private final SessionRepository sessionRepository;
    private final SessionIdentityGenerator sessionIdentityGenerator;
    private final SessionScenarioReadPort sessionScenarioReadPort;
    private final ProgressRepository progressRepository;

    public StartSessionUseCase(
            SessionRepository sessionRepository,
            SessionIdentityGenerator sessionIdentityGenerator,
            SessionScenarioReadPort sessionScenarioReadPort,
            ProgressRepository progressRepository
    ) {
        this.sessionRepository = sessionRepository;
        this.sessionIdentityGenerator = sessionIdentityGenerator;
        this.sessionScenarioReadPort = sessionScenarioReadPort;
        this.progressRepository = progressRepository;
    }

    public StartSessionResult start(StartSessionCommand command) {
        if (command.scenarioSlug() == null) {
            throw SessionRequestValidationException.missingScenarioSlug();
        }

        SessionScenarioSnapshot scenario = sessionScenarioReadPort.loadForSessionStart(
                command.scenarioSlug(),
                command.source()
        );

        TrainingSession session = sessionRepository.save(new TrainingSession(
                sessionIdentityGenerator.nextSessionId(),
                scenario.slug(),
                scenario.title(),
                scenario.source(),
                Instant.now(),
                SessionState.ACTIVE,
                0,
                0,
                null
        ));
        progressRepository.recordAttemptStart(new ScenarioAttemptStart(
                session.scenarioSlug(),
                session.scenarioTitle(),
                session.scenarioSource(),
                session.sessionId(),
                session.startedAt()
        ));

        return new StartSessionResult(
                session,
                SessionSubmissionAnswerTypes.supportedAnswerTypes(),
                SubmissionOutcome.boundaryReady(),
                RetryStatePolicy.initialState()
        );
    }
}
