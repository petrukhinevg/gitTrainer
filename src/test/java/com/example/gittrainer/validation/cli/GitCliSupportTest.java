package com.example.gittrainer.validation.cli;

import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GitCliSupportTest {

    @Test
    void tokenizesQuotedGitArguments() {
        List<String> tokens = GitCliSupport.tokenizeGitCommand(
                "git commit --allow-empty -m \"feat: branch commit\""
        );

        assertThat(tokens).containsExactly(
                GitCliSupport.resolveGitExecutable(),
                "commit",
                "--allow-empty",
                "-m",
                "feat: branch commit"
        );
    }

    @Test
    void rejectsShellSubstitutionsEvenWhenQuotesAreAllowed() {
        assertThatThrownBy(() -> GitCliSupport.tokenizeGitCommand("git commit -m $(whoami)"))
                .isInstanceOf(ValidationRunnerExecutionException.class)
                .hasMessageContaining("Shell-подстановки");
    }
}
