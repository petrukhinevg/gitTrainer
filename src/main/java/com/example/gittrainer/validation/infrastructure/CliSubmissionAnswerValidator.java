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
import com.example.gittrainer.validation.domain.SubmissionValidationResult;
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

    private static final long NANOS_PER_MILLISECOND = 1_000_000L;
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper().findAndRegisterModules();
    private static final String RUNNER_KIND = "cli-process";

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
    public SubmissionValidationResult validate(String scenarioSlug, SubmittedAnswer answer) {
        long startedAt = System.nanoTime();
        if (!"command_text".equals(answer.type())) {
            return SubmissionValidationResult.evaluated(
                    null,
                    null,
                    RUNNER_KIND,
                    elapsedMillis(startedAt),
                    ScenarioValidationEngine.unsupportedAnswerType()
            );
        }

        Optional<ScenarioValidationSpec> spec = specSource.findSpec(scenarioSlug, answer.type());
        if (spec.isEmpty()) {
            return SubmissionValidationResult.evaluated(
                    null,
                    null,
                    RUNNER_KIND,
                    elapsedMillis(startedAt),
                    ScenarioValidationEngine.missingRule()
            );
        }

        return runCli(new CliValidationRequest(scenarioSlug, answer, spec.get()), startedAt);
    }

    private SubmissionValidationResult runCli(CliValidationRequest request, long startedAt) {
        Path requestFile = null;
        try {
            requestFile = Files.createTempFile("git-validator-request-", ".json");
            OBJECT_MAPPER.writeValue(requestFile.toFile(), request);

            Process process = new ProcessBuilder(command(requestFile))
                    .redirectErrorStream(false)
                    .start();

            Duration effectiveTimeout = effectiveTimeout(request.spec());
            boolean finished = process.waitFor(effectiveTimeout.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw runnerFailure(
                        "validation-runner-timeout",
                        "Внешний CLI validator превысил лимит времени.",
                        null,
                        request.spec(),
                        startedAt
                );
            }

            String stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            String stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            if (process.exitValue() != 0) {
                throw runnerFailure(
                        "validation-runner-failed",
                        stderr.isBlank() ? "Внешний CLI validator завершился с ошибкой." : stderr,
                        null,
                        request.spec(),
                        startedAt
                );
            }
            if (stdout.isBlank()) {
                throw runnerFailure(
                        "validation-runner-empty-response",
                        "Внешний CLI validator не вернул JSON-ответ.",
                        null,
                        request.spec(),
                        startedAt
                );
            }

            CliValidationResponse response = OBJECT_MAPPER.readValue(stdout, CliValidationResponse.class);
            if (!"evaluated".equals(response.status())) {
                throw runnerFailure(
                        "validation-runner-invalid-response",
                        "Внешний CLI validator вернул неподдерживаемый статус: " + response.status(),
                        null,
                        request.spec(),
                        startedAt
                );
            }

            return SubmissionValidationResult.evaluated(
                    request.spec().specId(),
                    request.spec().validatorType(),
                    RUNNER_KIND,
                    elapsedMillis(startedAt),
                    new SubmissionOutcome(
                            response.status(),
                            response.correctness(),
                            response.code(),
                            response.message()
                    )
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw runnerFailure(
                    "validation-runner-interrupted",
                    "Ожидание CLI validator было прервано.",
                    exception,
                    request.spec(),
                    startedAt
            );
        } catch (IOException exception) {
            throw runnerFailure(
                    "validation-runner-io-failed",
                    "Не удалось выполнить внешний CLI validator.",
                    exception,
                    request.spec(),
                    startedAt
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

    private Duration effectiveTimeout(ScenarioValidationSpec spec) {
        if (spec.timeoutMs() <= 0) {
            return timeout;
        }
        return Duration.ofMillis(Math.min(timeout.toMillis(), spec.timeoutMs()));
    }

    private ValidationRunnerExecutionException runnerFailure(
            String errorCode,
            String message,
            Throwable cause,
            ScenarioValidationSpec spec,
            long startedAt
    ) {
        return new ValidationRunnerExecutionException(
                errorCode,
                message,
                cause,
                spec.specId(),
                spec.validatorType(),
                RUNNER_KIND,
                elapsedMillis(startedAt)
        );
    }

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / NANOS_PER_MILLISECOND;
    }
}
