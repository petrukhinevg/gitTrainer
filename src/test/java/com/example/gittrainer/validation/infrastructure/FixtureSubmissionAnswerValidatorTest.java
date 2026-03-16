package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FixtureSubmissionAnswerValidatorTest {

    private final FixtureSubmissionAnswerValidator validator = new FixtureSubmissionAnswerValidator();

    @Test
    void marksMatchingCommandAsCorrect() {
        SubmissionOutcome outcome = validator.validate(
                "status-basics",
                new SubmittedAnswer("command_text", "git status")
        );

        assertEquals("evaluated", outcome.status());
        assertEquals("correct", outcome.correctness());
        assertEquals("expected-command", outcome.code());
    }

    @Test
    void marksAcceptedCommandVariantAsCorrect() {
        SubmissionOutcome outcome = validator.validate(
                "status-basics",
                new SubmittedAnswer("command_text", "git status --short")
        );

        assertEquals("evaluated", outcome.status());
        assertEquals("correct", outcome.correctness());
        assertEquals("expected-command", outcome.code());
    }

    @Test
    void marksUnexpectedCommandAsIncorrect() {
        SubmissionOutcome outcome = validator.validate(
                "status-basics",
                new SubmittedAnswer("command_text", "git checkout main")
        );

        assertEquals("evaluated", outcome.status());
        assertEquals("incorrect", outcome.correctness());
        assertEquals("unexpected-command", outcome.code());
    }

    @Test
    void marksUnsupportedAnswerTypeAsUnsupported() {
        SubmissionOutcome outcome = validator.validate(
                "status-basics",
                new SubmittedAnswer("file_patch", "diff --git a")
        );

        assertEquals("evaluated", outcome.status());
        assertEquals("unsupported", outcome.correctness());
        assertEquals("unsupported-answer-type", outcome.code());
    }
}
