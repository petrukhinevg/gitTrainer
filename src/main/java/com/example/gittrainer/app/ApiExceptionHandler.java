package com.example.gittrainer.app;

import com.example.gittrainer.scenario.application.ScenarioDetailNotFoundException;
import com.example.gittrainer.scenario.application.ScenarioRepositoryContextNotAuthoredException;
import com.example.gittrainer.scenario.application.ScenarioTaskContentNotAuthoredException;
import com.example.gittrainer.scenario.infrastructure.ScenarioCatalogSourceUnavailableException;
import com.example.gittrainer.session.application.SessionNotFoundException;
import com.example.gittrainer.session.application.SessionRequestValidationException;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(SessionRequestValidationException.class)
    ProblemDetail handleValidationFailure(SessionRequestValidationException exception) {
        return ApiProblemDetailFactory.invalidSessionRequest(exception);
    }

    @ExceptionHandler(SessionNotFoundException.class)
    ProblemDetail handleMissingSession(SessionNotFoundException exception) {
        return ApiProblemDetailFactory.missingSession(exception);
    }

    @ExceptionHandler(ScenarioDetailNotFoundException.class)
    ProblemDetail handleMissingScenario(ScenarioDetailNotFoundException exception) {
        return ApiProblemDetailFactory.missingScenario(exception);
    }

    @ExceptionHandler(ScenarioCatalogSourceUnavailableException.class)
    ProblemDetail handleUnavailableSource(ScenarioCatalogSourceUnavailableException exception) {
        return ApiProblemDetailFactory.unavailableScenarioSource(exception);
    }

    @ExceptionHandler(ScenarioTaskContentNotAuthoredException.class)
    ProblemDetail handleMissingTaskContent(ScenarioTaskContentNotAuthoredException exception) {
        return ApiProblemDetailFactory.missingTaskContent(exception);
    }

    @ExceptionHandler(ScenarioRepositoryContextNotAuthoredException.class)
    ProblemDetail handleMissingRepositoryContext(ScenarioRepositoryContextNotAuthoredException exception) {
        return ApiProblemDetailFactory.missingRepositoryContext(exception);
    }
}
