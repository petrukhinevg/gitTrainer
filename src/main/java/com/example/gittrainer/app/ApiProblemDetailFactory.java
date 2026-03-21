package com.example.gittrainer.app;

import com.example.gittrainer.scenario.application.ScenarioDetailNotFoundException;
import com.example.gittrainer.scenario.application.ScenarioRepositoryContextNotAuthoredException;
import com.example.gittrainer.scenario.application.ScenarioSourceUnavailableException;
import com.example.gittrainer.scenario.application.ScenarioTaskContentNotAuthoredException;
import com.example.gittrainer.session.application.SessionNotFoundException;
import com.example.gittrainer.session.application.SessionRequestValidationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

final class ApiProblemDetailFactory {

    private ApiProblemDetailFactory() {
    }

    static ProblemDetail invalidSessionRequest(SessionRequestValidationException exception) {
        return createProblem(
                HttpStatus.BAD_REQUEST,
                "Некорректный запрос сессии",
                exception.getMessage(),
                exception.errorCode(),
                "terminal",
                false
        );
    }

    static ProblemDetail missingSession(SessionNotFoundException exception) {
        return createProblem(
                HttpStatus.NOT_FOUND,
                "Сессия не найдена",
                exception.getMessage(),
                "session-not-found",
                "terminal",
                false
        );
    }

    static ProblemDetail missingScenario(ScenarioDetailNotFoundException exception) {
        return createProblem(
                HttpStatus.NOT_FOUND,
                "Сценарий не найден",
                exception.getMessage(),
                "scenario-not-found",
                "terminal",
                false
        );
    }

    static ProblemDetail unavailableScenarioSource(ScenarioSourceUnavailableException exception) {
        ProblemDetail problem = createProblem(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Источник сценариев недоступен",
                exception.getMessage(),
                "scenario-source-unavailable",
                "retryable",
                true
        );
        problem.setProperty("sourceName", exception.sourceName());
        return problem;
    }

    static ProblemDetail missingTaskContent(ScenarioTaskContentNotAuthoredException exception) {
        return createProblem(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Контент сценария не подготовлен",
                exception.getMessage(),
                "scenario-task-content-not-authored",
                "terminal",
                false
        );
    }

    static ProblemDetail missingRepositoryContext(ScenarioRepositoryContextNotAuthoredException exception) {
        return createProblem(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Контекст сценария не подготовлен",
                exception.getMessage(),
                "scenario-repository-context-not-authored",
                "terminal",
                false
        );
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
