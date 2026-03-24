package com.example.gittrainer.session.application;

import com.example.gittrainer.validation.infrastructure.InMemoryValidationRunRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = """
        spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,\
        org.springframework.boot.jdbc.autoconfigure.DataSourceTransactionManagerAutoConfiguration
        """)
@ActiveProfiles("test")
class SubmitAnswerUseCaseValidationRunTest {

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
    void recordsValidationRunForSuccessfulSubmission() {
        StartSessionResult startedSession = startSessionUseCase.start(new StartSessionCommand("status-basics", null));

        SubmitAnswerResult result = submitAnswerUseCase.submit(
                startedSession.session().sessionId(),
                new SubmitAnswerCommand("command_text", "git status --short")
        );

        assertThat(validationRunRepository.findAll()).hasSize(1);
        assertThat(validationRunRepository.findAll().getFirst().sessionId()).isEqualTo(startedSession.session().sessionId());
        assertThat(validationRunRepository.findAll().getFirst().submissionId()).isEqualTo(result.submissionId());
        assertThat(validationRunRepository.findAll().getFirst().runnerStatus()).isEqualTo("evaluated");
        assertThat(validationRunRepository.findAll().getFirst().runnerKind()).isEqualTo("in-process");
        assertThat(validationRunRepository.findAll().getFirst().outcomeCode()).isEqualTo("expected-command");
    }
}
