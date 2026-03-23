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
    private final SessionWorkspaceManager sessionWorkspaceManager;

    public StartSessionUseCase(
            SessionRepository sessionRepository,
            SessionIdentityGenerator sessionIdentityGenerator,
            SessionScenarioReadPort sessionScenarioReadPort,
            ProgressRepository progressRepository,
            SessionWorkspaceManager sessionWorkspaceManager
    ) {
        this.sessionRepository = sessionRepository;
        this.sessionIdentityGenerator = sessionIdentityGenerator;
        this.sessionScenarioReadPort = sessionScenarioReadPort;
        this.progressRepository = progressRepository;
        this.sessionWorkspaceManager = sessionWorkspaceManager;
    }

    public StartSessionResult start(StartSessionCommand command) {
        if (command.scenarioSlug() == null) {
            throw SessionRequestValidationException.missingScenarioSlug();
        }

        SessionScenarioSnapshot scenario = sessionScenarioReadPort.loadForSessionStart(
                command.scenarioSlug(),
                command.source()
        );

        TrainingSession session = new TrainingSession(
                sessionIdentityGenerator.nextSessionId(),
                scenario.slug(),
                scenario.title(),
                scenario.source(),
                Instant.now(),
                SessionState.ACTIVE,
                0,
                0,
                null
        );
        sessionWorkspaceManager.initializeWorkspace(session.sessionId(), scenario.slug());
        TrainingSession persistedSession = sessionRepository.save(session);
        progressRepository.recordAttemptStart(new ScenarioAttemptStart(
                persistedSession.scenarioSlug(),
                persistedSession.scenarioTitle(),
                persistedSession.scenarioSource(),
                persistedSession.sessionId(),
                persistedSession.startedAt()
        ));

        return new StartSessionResult(
                persistedSession,
                SessionSubmissionAnswerTypes.supportedAnswerTypes(),
                SubmissionOutcome.boundaryReady(),
                RetryStatePolicy.initialState()
        );
    }
}
