package com.example.gittrainer.session.application;

import com.example.gittrainer.scenario.application.LoadScenarioDetailUseCase;
import com.example.gittrainer.scenario.application.ScenarioDetailResult;
import com.example.gittrainer.scenario.domain.ScenarioDetailQuery;
import com.example.gittrainer.session.domain.SessionState;
import com.example.gittrainer.session.domain.SubmissionPlaceholderOutcome;
import com.example.gittrainer.session.domain.TrainingSession;
import org.springframework.stereotype.Service;

import java.time.Instant;
@Service
public class StartSessionUseCase {

    private final SessionRepository sessionRepository;
    private final SessionIdentityGenerator sessionIdentityGenerator;
    private final LoadScenarioDetailUseCase loadScenarioDetailUseCase;

    public StartSessionUseCase(
            SessionRepository sessionRepository,
            SessionIdentityGenerator sessionIdentityGenerator,
            LoadScenarioDetailUseCase loadScenarioDetailUseCase
    ) {
        this.sessionRepository = sessionRepository;
        this.sessionIdentityGenerator = sessionIdentityGenerator;
        this.loadScenarioDetailUseCase = loadScenarioDetailUseCase;
    }

    public StartSessionResult start(StartSessionCommand command) {
        if (command.scenarioSlug() == null) {
            throw new SessionRequestValidationException("Scenario slug is required to start a session.");
        }

        ScenarioDetailResult detailResult = loadScenarioDetailUseCase.load(
                new ScenarioDetailQuery(command.scenarioSlug(), command.source())
        );

        TrainingSession session = sessionRepository.save(new TrainingSession(
                sessionIdentityGenerator.nextSessionId(),
                detailResult.detail().slug(),
                detailResult.detail().title(),
                detailResult.source(),
                Instant.now(),
                SessionState.ACTIVE,
                0,
                null
        ));

        return new StartSessionResult(
                session,
                SessionSubmissionAnswerTypes.supportedAnswerTypes(),
                SubmissionPlaceholderOutcome.boundaryReady()
        );
    }
}
