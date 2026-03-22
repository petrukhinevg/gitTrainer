package com.example.gittrainer.validation.infrastructure;

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
@ActiveProfiles("local-memory")
class CliSubmissionAnswerValidatorTest {

    @Autowired
    private SubmissionAnswerValidator submissionAnswerValidator;

    @Test
    void validatesBranchSafetyUsingRealGitCommandProbe() {
        assertThat(submissionAnswerValidator.validate(
                "branch-safety",
                new com.example.gittrainer.session.domain.SubmittedAnswer("command_text", "git branch --show-current")
        ).outcome().correctness()).isEqualTo("correct");
    }

    @Test
    void validatesRemoteSyncPreviewUsingRealGitRepoStateProbe() {
        assertThat(submissionAnswerValidator.validate(
                "remote-sync-preview",
                new com.example.gittrainer.session.domain.SubmittedAnswer("command_text", "git fetch origin")
        ).outcome().correctness()).isEqualTo("correct");
    }
}
