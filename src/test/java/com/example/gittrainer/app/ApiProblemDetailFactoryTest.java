package com.example.gittrainer.app;

import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

import static org.assertj.core.api.Assertions.assertThat;

class ApiProblemDetailFactoryTest {

    @Test
    void rendersFriendlyBadRequestForInvalidUserGitCommand() {
        ProblemDetail problem = ApiProblemDetailFactory.validationRunnerUnavailable(
                new ValidationRunnerExecutionException(
                        "validation-runner-command-must-start-with-git",
                        "internal message"
                )
        );

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(problem.getTitle()).isEqualTo("Некорректная Git-команда");
        assertThat(problem.getDetail()).isEqualTo("Здесь нужна именно Git-команда, начинающаяся с `git`.");
        assertThat(problem.getProperties()).containsEntry("failureDisposition", "terminal");
        assertThat(problem.getProperties()).containsEntry("retryable", false);
    }
}
