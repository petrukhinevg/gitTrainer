package com.example.gittrainer.session.api;

import com.example.gittrainer.scenario.application.ScenarioDetailNotFoundException;
import com.example.gittrainer.scenario.infrastructure.ScenarioCatalogSourceUnavailableException;
import com.example.gittrainer.session.application.SessionNotFoundException;
import com.example.gittrainer.session.application.SessionRequestValidationException;
import com.example.gittrainer.session.application.StartSessionCommand;
import com.example.gittrainer.session.application.StartSessionUseCase;
import com.example.gittrainer.session.application.SubmitAnswerCommand;
import com.example.gittrainer.session.application.SubmitAnswerUseCase;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final StartSessionUseCase startSessionUseCase;
    private final SubmitAnswerUseCase submitAnswerUseCase;
    private final SessionResponseMapper sessionResponseMapper;

    public SessionController(
            StartSessionUseCase startSessionUseCase,
            SubmitAnswerUseCase submitAnswerUseCase,
            SessionResponseMapper sessionResponseMapper
    ) {
        this.startSessionUseCase = startSessionUseCase;
        this.submitAnswerUseCase = submitAnswerUseCase;
        this.sessionResponseMapper = sessionResponseMapper;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SessionStartResponse startSession(@RequestBody(required = false) SessionStartRequest request) {
        return sessionResponseMapper.toStartResponse(
                startSessionUseCase.start(new StartSessionCommand(
                        request == null ? null : request.scenarioSlug(),
                        request == null ? null : request.source()
                ))
        );
    }

    @PostMapping("/{sessionId}/submissions")
    public SessionSubmissionResponse submitAnswer(
            @PathVariable String sessionId,
            @RequestBody(required = false) SessionSubmissionRequest request
    ) {
        return sessionResponseMapper.toSubmissionResponse(
                submitAnswerUseCase.submit(
                        sessionId,
                        new SubmitAnswerCommand(
                                request == null ? null : request.answerType(),
                                request == null ? null : request.answer()
                        )
                )
        );
    }

    @ExceptionHandler(SessionRequestValidationException.class)
    ProblemDetail handleValidationFailure(SessionRequestValidationException exception) {
        return SessionFailureProblemFactory.invalidRequest(exception);
    }

    @ExceptionHandler(SessionNotFoundException.class)
    ProblemDetail handleMissingSession(SessionNotFoundException exception) {
        return SessionFailureProblemFactory.missingSession(exception);
    }

    @ExceptionHandler(ScenarioDetailNotFoundException.class)
    ProblemDetail handleMissingScenario(ScenarioDetailNotFoundException exception) {
        return SessionFailureProblemFactory.missingScenario(exception);
    }

    @ExceptionHandler(ScenarioCatalogSourceUnavailableException.class)
    ProblemDetail handleUnavailableSource(ScenarioCatalogSourceUnavailableException exception) {
        return SessionFailureProblemFactory.unavailableScenarioSource(exception);
    }
}

record SessionStartRequest(
        String scenarioSlug,
        String source
) {
}

record SessionSubmissionRequest(
        String answerType,
        String answer
) {
}
