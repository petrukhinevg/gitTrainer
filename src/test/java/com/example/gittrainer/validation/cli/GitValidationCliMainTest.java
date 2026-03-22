package com.example.gittrainer.validation.cli;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.ScenarioValidationRule;
import com.example.gittrainer.validation.application.ScenarioValidationSpec;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GitValidationCliMainTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper().findAndRegisterModules();

    @Test
    void writesJsonOutcomeToStdoutForMatchingCommand() throws Exception {
        CliValidationRequest request = new CliValidationRequest(
                "status-basics",
                new SubmittedAnswer("command_text", "git status --short"),
                new ScenarioValidationSpec(
                        "fixture:status-basics:command_text",
                        "status-basics",
                        "command_text",
                        "exact_command_match",
                        5000,
                        Map.of(),
                        List.of(
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git status",
                                        "git status",
                                        "correct",
                                        "expected-command",
                                        "ok"
                                ),
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git status --short",
                                        "git status --short",
                                        "correct",
                                        "expected-command",
                                        "ok"
                                )
                        )
                )
        );
        Path requestFile = Files.createTempFile("git-cli-test-", ".json");
        Files.writeString(requestFile, OBJECT_MAPPER.writeValueAsString(request));

        PrintStream originalOut = System.out;
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        try {
            System.setOut(new PrintStream(stdout));

            GitValidationCliMain.main(new String[]{"--request-file", requestFile.toString()});
        } finally {
            System.setOut(originalOut);
            Files.deleteIfExists(requestFile);
        }

        CliValidationResponse response = OBJECT_MAPPER.readValue(stdout.toString(), CliValidationResponse.class);
        assertThat(response.status()).isEqualTo("evaluated");
        assertThat(response.correctness()).isEqualTo("correct");
        assertThat(response.code()).isEqualTo("expected-command");
        assertThat(response.observations()).extracting(CliValidationObservation::message)
                .containsExactly("git status --short");
    }

    @Test
    void writesJsonOutcomeForRealGitCommandProbe() throws Exception {
        CliValidationRequest request = new CliValidationRequest(
                "branch-safety",
                new SubmittedAnswer("command_text", "git branch --show-current"),
                new ScenarioValidationSpec(
                        "fixture:branch-safety:command_text",
                        "branch-safety",
                        "command_text",
                        "git_command_probe",
                        5000,
                        Map.of(
                                "expectedExitCode", 0,
                                "expectedStdout", "release/hotfix-7",
                                "workspaceTemplate", Map.of(
                                        "initialBranch", "main",
                                        "currentBranch", "release/hotfix-7",
                                        "branches", List.of("release/hotfix-7", "feature/menu-refresh", "main"),
                                        "committedFiles", List.of(
                                                Map.of("path", "src/ui/header.css", "content", ".header { padding: 8px; }\n"),
                                                Map.of("path", "docs/release-checklist.md", "content", "- verify deploy\n")
                                        ),
                                        "modifiedFiles", List.of(
                                                Map.of("path", "src/ui/header.css", "content", ".header { padding: 12px; }\n"),
                                                Map.of("path", "docs/release-checklist.md", "content", "- verify deploy\n- smoke test\n")
                                        ),
                                        "untrackedFiles", List.of()
                                )
                        ),
                        List.of(new ScenarioValidationRule(
                                "exact_normalized_command",
                                "git branch --show-current",
                                "git branch --show-current",
                                "correct",
                                "expected-command",
                                "ok"
                        ))
                )
        );
        Path requestFile = Files.createTempFile("git-cli-probe-test-", ".json");
        Files.writeString(requestFile, OBJECT_MAPPER.writeValueAsString(request));

        PrintStream originalOut = System.out;
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        try {
            System.setOut(new PrintStream(stdout));

            GitValidationCliMain.main(new String[]{"--request-file", requestFile.toString()});
        } finally {
            System.setOut(originalOut);
            Files.deleteIfExists(requestFile);
        }

        CliValidationResponse response = OBJECT_MAPPER.readValue(stdout.toString(), CliValidationResponse.class);
        assertThat(response.status()).isEqualTo("evaluated");
        assertThat(response.correctness()).isEqualTo("correct");
        assertThat(response.code()).isEqualTo("expected-command");
        assertThat(response.observations()).extracting(CliValidationObservation::code)
                .contains("stdout", "workspace-branch");
    }
}
