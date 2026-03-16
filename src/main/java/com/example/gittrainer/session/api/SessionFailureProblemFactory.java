package com.example.gittrainer.session.api;

import com.example.gittrainer.scenario.application.ScenarioDetailNotFoundException;
import com.example.gittrainer.scenario.infrastructure.ScenarioCatalogSourceUnavailableException;
import com.example.gittrainer.session.application.SessionNotFoundException;
import com.example.gittrainer.session.application.SessionRequestValidationException;
import com.example.gittrainer.session.application.UnsupportedSubmissionAnswerTypeException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

final class SessionFailureProblemFactory {

    private SessionFailureProblemFactory() {
    }

    static ProblemDetail invalidRequest(SessionRequestValidationException exception) {
        return createProblem(
                HttpStatus.BAD_REQUEST,
                "Invalid session request",
                exception.getMessage(),
                exception.errorCode(),
                "terminal",
                false
        );
    }

    static ProblemDetail unsupportedAnswer(UnsupportedSubmissionAnswerTypeException exception) {
        ProblemDetail problem = createProblem(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Unsupported answer type",
                exception.getMessage(),
                exception.errorCode(),
                "terminal",
                false
        );
        problem.setProperty("requestedAnswerType", exception.requestedAnswerType());
        problem.setProperty("supportedAnswerTypes", exception.supportedAnswerTypes());
        return problem;
    }

    static ProblemDetail missingSession(SessionNotFoundException exception) {
        return createProblem(
                HttpStatus.NOT_FOUND,
                "Session not found",
                exception.getMessage(),
                "session-not-found",
                "terminal",
                false
        );
    }

    static ProblemDetail missingScenario(ScenarioDetailNotFoundException exception) {
        return createProblem(
                HttpStatus.NOT_FOUND,
                "Scenario not found",
                exception.getMessage(),
                "scenario-not-found",
                "terminal",
                false
        );
    }

    static ProblemDetail unavailableScenarioSource(ScenarioCatalogSourceUnavailableException exception) {
        ProblemDetail problem = createProblem(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Scenario source unavailable",
                exception.getMessage(),
                "scenario-source-unavailable",
                "retryable",
                true
        );
        problem.setProperty("sourceName", exception.sourceName());
        return problem;
    }

    private static ProblemDetail createProblem(
            HttpStatus status,
            String title,
            String detail,
            String code,
            String failureDisposition,
            boolean retryable
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);
        problem.setProperty("code", code);
        problem.setProperty("failureDisposition", failureDisposition);
        problem.setProperty("retryable", retryable);
        return problem;
    }
}
