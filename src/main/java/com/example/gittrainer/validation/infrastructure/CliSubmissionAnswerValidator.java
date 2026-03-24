package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.ScenarioValidationEngine;
import com.example.gittrainer.validation.application.ScenarioValidationSpec;
import com.example.gittrainer.validation.application.ScenarioValidationSpecSource;
import com.example.gittrainer.validation.application.SubmissionAnswerValidator;
import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;
import com.example.gittrainer.validation.cli.CliValidationRequest;
import com.example.gittrainer.validation.cli.CliValidationObservation;
import com.example.gittrainer.validation.cli.CliValidationResponse;
import com.example.gittrainer.validation.cli.GitValidationCliMain;
import com.example.gittrainer.validation.domain.SubmissionValidationResult;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import com.example.gittrainer.validation.domain.SubmissionTerminalOutput;
import com.example.gittrainer.session.application.SessionWorkspaceManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
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
    private final SessionWorkspaceManager sessionWorkspaceManager;
    private final CliValidationProcessPolicy processPolicy;
    private final Duration timeout;
    private final String executableOverride;

    public CliSubmissionAnswerValidator(
            ScenarioValidationSpecSource specSource,
            SessionWorkspaceManager sessionWorkspaceManager,
            CliValidationProcessPolicy processPolicy,
            @Value("${gittrainer.validator.cli.timeout-ms:5000}") long timeoutMs,
            @Value("${gittrainer.validator.cli.executable:}") String executableOverride
    ) {
        this.specSource = specSource;
        this.sessionWorkspaceManager = sessionWorkspaceManager;
        this.processPolicy = processPolicy;
        this.timeout = Duration.ofMillis(timeoutMs);
        this.executableOverride = executableOverride == null ? "" : executableOverride.trim();
    }

    @Override
    public SubmissionValidationResult validate(
            String sessionId,
            String scenarioSlug,
            List<SubmittedAnswer> priorAnswers,
            SubmittedAnswer answer
    ) {
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

        String workspacePath = sessionWorkspaceManager.resolveWorkspacePath(sessionId).map(Path::toString).orElse(null);
        return runCli(new CliValidationRequest(scenarioSlug, priorAnswers, answer, spec.get(), workspacePath), startedAt);
    }

    private SubmissionValidationResult runCli(CliValidationRequest request, long startedAt) {
        Path requestFile = null;
        Path stdoutFile = null;
        Path stderrFile = null;
        try {
            requestFile = Files.createTempFile("git-validator-request-", ".json");
            stdoutFile = Files.createTempFile("git-validator-stdout-", ".log");
            stderrFile = Files.createTempFile("git-validator-stderr-", ".log");
            OBJECT_MAPPER.writeValue(requestFile.toFile(), request);

            ProcessBuilder processBuilder = new ProcessBuilder(command(requestFile, request.spec(), startedAt))
                    .directory(resolveWorkingDirectory(request.spec(), startedAt).toFile())
                    .redirectOutput(stdoutFile.toFile())
                    .redirectError(stderrFile.toFile());
            if (!processPolicy.inheritEnvironment()) {
                processBuilder.environment().clear();
            }
            Process process = processBuilder.start();

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

            String stdout = readLimitedFile(stdoutFile).trim();
            String stderr = readLimitedFile(stderrFile).trim();
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
                    ),
                    toTerminalOutput(response.observations())
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
            deleteIfExists(requestFile);
            deleteIfExists(stdoutFile);
            deleteIfExists(stderrFile);
        }
    }

    private SubmissionTerminalOutput toTerminalOutput(List<CliValidationObservation> observations) {
        if (observations == null || observations.isEmpty()) {
            return null;
        }

        String stdout = null;
        String stderr = null;
        for (CliValidationObservation observation : observations) {
            if (observation == null || observation.code() == null) {
                continue;
            }
            if ("stdout".equals(observation.code())) {
                stdout = observation.message();
            }
            if ("stderr".equals(observation.code())) {
                stderr = observation.message();
            }
        }

        SubmissionTerminalOutput terminalOutput = new SubmissionTerminalOutput(stdout, stderr);
        return terminalOutput.hasContent() ? terminalOutput : null;
    }

    private List<String> command(Path requestFile, ScenarioValidationSpec spec, long startedAt) {
        if (!executableOverride.isBlank()) {
            validateExternalExecutableAllowed(spec, startedAt);
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

    private Path resolveWorkingDirectory(ScenarioValidationSpec spec, long startedAt) {
        if (!processPolicy.isWorkingDirectoryUsable()) {
            throw runnerFailure(
                    "validation-runner-invalid-working-directory",
                    "Рабочая директория CLI validator не существует или недоступна.",
                    null,
                    spec,
                    startedAt
            );
        }
        if (!processPolicy.isWorkingDirectoryInsideAllowedRoot()) {
            throw runnerFailure(
                    "validation-runner-working-directory-outside-root",
                    "Рабочая директория CLI validator выходит за разрешённый root.",
                    null,
                    spec,
                    startedAt
            );
        }
        return processPolicy.workingDirectory();
    }

    private void validateExternalExecutableAllowed(ScenarioValidationSpec spec, long startedAt) {
        if (!processPolicy.allowExternalExecutable()) {
            throw runnerFailure(
                    "validation-runner-executable-not-allowed",
                    "Внешний executable для CLI validator запрещён policy-конфигурацией.",
                    null,
                    spec,
                    startedAt
            );
        }
        Path executablePath = Path.of(executableOverride).normalize();
        if (!executablePath.isAbsolute()
                || !Files.isRegularFile(executablePath)
                || !Files.isExecutable(executablePath)) {
            throw runnerFailure(
                    "validation-runner-invalid-executable",
                    "Указанный executable для CLI validator недоступен.",
                    null,
                    spec,
                    startedAt
            );
        }
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

    private String readLimitedFile(Path file) throws IOException {
        try (InputStream inputStream = Files.newInputStream(file)) {
            byte[] bytes = inputStream.readNBytes(processPolicy.maxOutputBytes() + 1);
            if (bytes.length > processPolicy.maxOutputBytes()) {
                return new String(bytes, 0, processPolicy.maxOutputBytes(), StandardCharsets.UTF_8).trim()
                        + " [truncated]";
            }
            return new String(bytes, StandardCharsets.UTF_8).trim();
        }
    }

    private void deleteIfExists(Path path) {
        if (path == null) {
            return;
        }
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // best-effort cleanup for temporary validator artifacts
        }
    }
}
