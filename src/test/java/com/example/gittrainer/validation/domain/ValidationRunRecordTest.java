package com.example.gittrainer.validation.domain;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class ValidationRunRecordTest {

    @Test
    void usesFallbackRunnerKindForRunnerFailuresWithoutMetadata() {
        ValidationRunRecord record = ValidationRunRecord.runnerFailure(
                "validation-1",
                "session-1",
                "submission-1",
                "history-cleanup-preview",
                new SubmittedAnswer("command_text", "выап"),
                new ValidationRunnerExecutionException(
                        "validation-runner-command-must-start-with-git",
                        "Здесь нужна именно Git-команда, начинающаяся с `git`."
                ),
                Instant.parse("2026-03-24T16:22:17Z")
        );

        assertThat(record.runnerKind()).isEqualTo("validation-runner");
        assertThat(record.runnerStatus()).isEqualTo("runner-failed");
        assertThat(record.outcomeCode()).isEqualTo("validation-runner-command-must-start-with-git");
    }
}
