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

import static org.assertj.core.api.Assertions.assertThat;

class GitValidationCliMainTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper().findAndRegisterModules();

    @Test
    void writesJsonOutcomeToStdoutForMatchingCommand() throws Exception {
        CliValidationRequest request = new CliValidationRequest(
                "status-basics",
                new SubmittedAnswer("command_text", "git status --short"),
                new ScenarioValidationSpec(
                        "status-basics",
                        "command_text",
                        "exact_command_match",
                        List.of(
                                new ScenarioValidationRule(
                                        "git status",
                                        "correct",
                                        "expected-command",
                                        "ok"
                                ),
                                new ScenarioValidationRule(
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
}
