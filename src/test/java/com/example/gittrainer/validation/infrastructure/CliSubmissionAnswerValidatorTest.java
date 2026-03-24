package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.SubmissionAnswerValidator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "gittrainer.validator.cli.enabled=true",
        "spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,org.springframework.boot.jdbc.autoconfigure.DataSourceTransactionManagerAutoConfiguration"
})
@ActiveProfiles("test")
class CliSubmissionAnswerValidatorTest {

    @Autowired
    private SubmissionAnswerValidator submissionAnswerValidator;

    @Test
    void validatesBranchSafetyUsingRealGitCommandProbe() {
        assertThat(submissionAnswerValidator.validate(
                "branch-safety",
                new com.example.gittrainer.session.domain.SubmittedAnswer("command_text", "git branch --show-current")
        ).outcome().correctness()).isEqualTo("partial");
    }

    @Test
    void completesBranchSafetyAfterBranchReadingAndCompactStatus() {
        assertThat(submissionAnswerValidator.validate(
                null,
                "branch-safety",
                java.util.List.of(new SubmittedAnswer("command_text", "git branch --show-current")),
                new SubmittedAnswer("command_text", "git status -sb")
        ).outcome().correctness()).isEqualTo("correct");
    }

    @Test
    void validatesRemoteSyncPreviewUsingRealGitRepoStateProbe() {
        assertThat(submissionAnswerValidator.validate(
                "remote-sync-preview",
                new SubmittedAnswer("command_text", "git fetch origin")
        ).outcome().correctness()).isEqualTo("correct");
    }

    @Test
    void validatesStashCheckpointScenarioUsingWorkspaceStateProbe() {
        assertThat(submissionAnswerValidator.validate(
                null,
                "stash-checkpoint-draft",
                java.util.List.of(new SubmittedAnswer("command_text", "git status -sb")),
                new SubmittedAnswer("command_text", "git stash push -u")
        ).outcome().correctness()).isEqualTo("correct");
    }

    @Test
    void validatesTagCheckpointScenarioUsingWorkspaceTags() {
        assertThat(submissionAnswerValidator.validate(
                "tag-checkpoint-preview",
                new SubmittedAnswer("command_text", "git show-ref --tags")
        ).outcome().correctness()).isEqualTo("correct");
    }

    @Test
    void acceptsQuotedSandboxCommandInPermissiveSandboxMode() {
        assertThat(submissionAnswerValidator.validate(
                "merge-sandbox-outline",
                new SubmittedAnswer("command_text", "git branch --list \"main\"")
        ).outcome().correctness()).isEqualTo("correct");
    }
}
