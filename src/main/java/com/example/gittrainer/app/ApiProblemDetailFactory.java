package com.example.gittrainer.app;

import com.example.gittrainer.scenario.application.ScenarioDetailNotFoundException;
import com.example.gittrainer.scenario.application.ScenarioRepositoryContextMissingException;
import com.example.gittrainer.scenario.application.ScenarioSourceUnavailableException;
import com.example.gittrainer.scenario.application.ScenarioTaskContentMissingException;
import com.example.gittrainer.session.application.SessionNotFoundException;
import com.example.gittrainer.session.application.SessionRequestValidationException;
import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;
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

    static ProblemDetail missingTaskContent(ScenarioTaskContentMissingException exception) {
        return createProblem(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Контент сценария не подготовлен",
                exception.getMessage(),
                "scenario-task-content-missing",
                "terminal",
                false
        );
    }

    static ProblemDetail missingRepositoryContext(ScenarioRepositoryContextMissingException exception) {
        return createProblem(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Контекст сценария не подготовлен",
                exception.getMessage(),
                "scenario-repository-context-missing",
                "terminal",
                false
        );
    }

    static ProblemDetail validationRunnerUnavailable(ValidationRunnerExecutionException exception) {
        if (isInvalidUserCommand(exception.errorCode())) {
            return createProblem(
                    HttpStatus.BAD_REQUEST,
                    "Некорректная Git-команда",
                    userFacingValidationRunnerMessage(exception),
                    exception.errorCode(),
                    "terminal",
                    false
            );
        }

        return createProblem(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Проверка сценария временно недоступна",
                exception.getMessage(),
                exception.errorCode(),
                "retryable",
                true
        );
    }

    private static boolean isInvalidUserCommand(String errorCode) {
        return "validation-runner-empty-command".equals(errorCode)
                || "validation-runner-shell-operators-not-supported".equals(errorCode)
                || "validation-runner-command-must-start-with-git".equals(errorCode)
                || "validation-runner-quoted-args-not-supported".equals(errorCode);
    }

    private static String userFacingValidationRunnerMessage(ValidationRunnerExecutionException exception) {
        return switch (String.valueOf(exception.errorCode())) {
            case "validation-runner-empty-command" ->
                    "Введите одну Git-команду. Например: `git status`.";
            case "validation-runner-shell-operators-not-supported" ->
                    "Тренажёр принимает одну Git-команду за раз, без `;`, `&&`, пайпов и других shell-операторов.";
            case "validation-runner-command-must-start-with-git" ->
                    "Здесь нужна именно Git-команда, начинающаяся с `git`.";
            case "validation-runner-quoted-args-not-supported" ->
                    "Кавычки в аргументах допустимы, но shell-подстановки и незакрытые кавычки не поддерживаются.";
            default -> exception.getMessage();
        };
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
