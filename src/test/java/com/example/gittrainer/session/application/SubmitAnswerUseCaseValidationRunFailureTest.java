package com.example.gittrainer.session.application;

import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;
import com.example.gittrainer.validation.infrastructure.InMemoryValidationRunRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = {
        "gittrainer.validator.cli.enabled=true",
        "gittrainer.validator.cli.allow-external-executable=true",
        "gittrainer.validator.cli.executable=/definitely-missing-cli-binary",
        "spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,org.springframework.boot.jdbc.autoconfigure.DataSourceTransactionManagerAutoConfiguration"
})
@ActiveProfiles("test")
class SubmitAnswerUseCaseValidationRunFailureTest {

    @Autowired
    private StartSessionUseCase startSessionUseCase;

    @Autowired
    private SubmitAnswerUseCase submitAnswerUseCase;

    @Autowired
    private InMemoryValidationRunRepository validationRunRepository;

    @BeforeEach
    void clearRuns() {
        validationRunRepository.clear();
    }

    @Test
    void recordsValidationRunWhenCliRunnerFails() {
        StartSessionResult startedSession = startSessionUseCase.start(new StartSessionCommand("status-basics", null));

        assertThatThrownBy(() -> submitAnswerUseCase.submit(
                startedSession.session().sessionId(),
                new SubmitAnswerCommand("command_text", "git status")
        ))
                .isInstanceOf(ValidationRunnerExecutionException.class)
                .hasMessage("Указанный executable для CLI validator недоступен.");

        assertThat(validationRunRepository.findAll()).hasSize(1);
        assertThat(validationRunRepository.findAll().getFirst().runnerStatus()).isEqualTo("runner-failed");
        assertThat(validationRunRepository.findAll().getFirst().runnerKind()).isEqualTo("cli-process");
        assertThat(validationRunRepository.findAll().getFirst().outcomeCode())
                .isEqualTo("validation-runner-invalid-executable");
        assertThat(validationRunRepository.findAll().getFirst().validatorSpecId())
                .isEqualTo("default:status-basics:command_text");
    }
}
