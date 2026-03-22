package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.ScenarioValidationEngine;
import com.example.gittrainer.validation.application.ScenarioValidationSpec;
import com.example.gittrainer.validation.application.ScenarioValidationSpecSource;
import com.example.gittrainer.validation.application.SubmissionAnswerValidator;
import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;
import com.example.gittrainer.validation.cli.CliValidationRequest;
import com.example.gittrainer.validation.cli.CliValidationResponse;
import com.example.gittrainer.validation.cli.GitValidationCliMain;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Primary
@Component
@ConditionalOnProperty(prefix = "gittrainer.validator.cli", name = "enabled", havingValue = "true")
public class CliSubmissionAnswerValidator implements SubmissionAnswerValidator {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper().findAndRegisterModules();

    private final ScenarioValidationSpecSource specSource;
    private final Duration timeout;
    private final String executableOverride;

    public CliSubmissionAnswerValidator(
            ScenarioValidationSpecSource specSource,
            @Value("${gittrainer.validator.cli.timeout-ms:5000}") long timeoutMs,
            @Value("${gittrainer.validator.cli.executable:}") String executableOverride
    ) {
        this.specSource = specSource;
        this.timeout = Duration.ofMillis(timeoutMs);
        this.executableOverride = executableOverride == null ? "" : executableOverride.trim();
    }

    @Override
    public SubmissionOutcome validate(String scenarioSlug, SubmittedAnswer answer) {
        if (!"command_text".equals(answer.type())) {
            return ScenarioValidationEngine.unsupportedAnswerType();
        }

        Optional<ScenarioValidationSpec> spec = specSource.findSpec(scenarioSlug, answer.type());
        if (spec.isEmpty()) {
            return ScenarioValidationEngine.missingRule();
        }

        return runCli(new CliValidationRequest(scenarioSlug, answer, spec.get()));
    }

    private SubmissionOutcome runCli(CliValidationRequest request) {
        Path requestFile = null;
        try {
            requestFile = Files.createTempFile("git-validator-request-", ".json");
            OBJECT_MAPPER.writeValue(requestFile.toFile(), request);

            Process process = new ProcessBuilder(command(requestFile))
                    .redirectErrorStream(false)
                    .start();

            boolean finished = process.waitFor(timeout.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new ValidationRunnerExecutionException(
                        "validation-runner-timeout",
                        "Внешний CLI validator превысил лимит времени."
                );
            }

            String stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            String stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            if (process.exitValue() != 0) {
                throw new ValidationRunnerExecutionException(
                        "validation-runner-failed",
                        stderr.isBlank() ? "Внешний CLI validator завершился с ошибкой." : stderr
                );
            }
            if (stdout.isBlank()) {
                throw new ValidationRunnerExecutionException(
                        "validation-runner-empty-response",
                        "Внешний CLI validator не вернул JSON-ответ."
                );
            }

            CliValidationResponse response = OBJECT_MAPPER.readValue(stdout, CliValidationResponse.class);
            if (!"evaluated".equals(response.status())) {
                throw new ValidationRunnerExecutionException(
                        "validation-runner-invalid-response",
                        "Внешний CLI validator вернул неподдерживаемый статус: " + response.status()
                );
            }

            return new SubmissionOutcome(
                    response.status(),
                    response.correctness(),
                    response.code(),
                    response.message()
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ValidationRunnerExecutionException(
                    "validation-runner-interrupted",
                    "Ожидание CLI validator было прервано.",
                    exception
            );
        } catch (IOException exception) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-io-failed",
                    "Не удалось выполнить внешний CLI validator.",
                    exception
            );
        } finally {
            if (requestFile != null) {
                try {
                    Files.deleteIfExists(requestFile);
                } catch (IOException ignored) {
                    // best-effort cleanup for temporary request payload
                }
            }
        }
    }

    private List<String> command(Path requestFile) {
        if (!executableOverride.isBlank()) {
            return List.of(executableOverride, "--request-file", requestFile.toString());
        }

        return List.of(
                resolveJavaExecutable(),
                "-cp",
                System.getProperty("java.class.path"),
                GitValidationCliMain.class.getName(),
                "--request-file",
                requestFile.toString()
        );
    }

    private String resolveJavaExecutable() {
        String suffix = System.getProperty("os.name").toLowerCase().contains("win") ? "java.exe" : "java";
        return Path.of(System.getProperty("java.home"), "bin", suffix).toString();
    }
}
