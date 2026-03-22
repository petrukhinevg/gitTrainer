package com.example.gittrainer.validation.cli;

import com.example.gittrainer.validation.application.CommandTextNormalizer;
import com.example.gittrainer.validation.application.ScenarioValidationRule;
import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class GitCommandProbeValidator {

    private static final String GIT_COMMAND_PROBE = "git_command_probe";

    private GitCommandProbeValidator() {
    }

    public static CliValidationResponse handle(CliValidationRequest request) {
        GitCommandProbeConfig config = GitCommandProbeConfig.from(request.spec().config());
        String normalizedAnswer = CommandTextNormalizer.normalize(request.answer().value());
        ScenarioValidationRule matchedRule = request.spec().rules().stream()
                .filter(rule -> rule.normalizedAnswerValue().equals(normalizedAnswer))
                .findFirst()
                .orElse(null);
        if (matchedRule == null) {
            return new CliValidationResponse(
                    "evaluated",
                    "incorrect",
                    "unexpected-command",
                    "Отправленная команда не совпадает с ожидаемым безопасным следующим шагом для этого сценария.",
                    List.of(new CliValidationObservation("normalized-answer", normalizedAnswer)),
                    List.of()
            );
        }

        List<String> tokens = tokenizeGitCommand(request.answer().value());
        Path workspace = null;
        try {
            workspace = Files.createTempDirectory("git-validator-workspace-");
            prepareWorkspace(workspace, config.workspaceTemplate());
            CommandResult commandResult = runCommand(tokens, workspace);

            if (commandResult.exitCode() != config.expectedExitCode()) {
                return mismatchResponse(
                        normalizedAnswer,
                        "git-command-exit-mismatch",
                        "Команда выполнилась не так, как ожидается для этого сценария.",
                        commandResult
                );
            }
            if (!config.expectedStdout().equals(commandResult.stdout().trim())) {
                return mismatchResponse(
                        normalizedAnswer,
                        "git-command-output-mismatch",
                        "Команда не подтвердила ожидаемое состояние репозитория.",
                        commandResult
                );
            }

            return new CliValidationResponse(
                    "evaluated",
                    matchedRule.correctness(),
                    matchedRule.code(),
                    matchedRule.message(),
                    List.of(
                            new CliValidationObservation("normalized-answer", normalizedAnswer),
                            new CliValidationObservation("stdout", commandResult.stdout().trim()),
                            new CliValidationObservation("workspace-branch", config.expectedStdout())
                    ),
                    List.of()
            );
        } catch (IOException exception) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-workspace-setup-failed",
                    "Не удалось подготовить временный git workspace для CLI validator.",
                    exception
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ValidationRunnerExecutionException(
                    "validation-runner-command-interrupted",
                    "Проверка git-команды была прервана.",
                    exception
            );
        } finally {
            deleteRecursively(workspace);
        }
    }

    public static boolean supports(String validatorType) {
        return GIT_COMMAND_PROBE.equals(validatorType);
    }

    private static CliValidationResponse mismatchResponse(
            String normalizedAnswer,
            String code,
            String message,
            CommandResult commandResult
    ) {
        return new CliValidationResponse(
                "evaluated",
                "incorrect",
                code,
                message,
                List.of(
                        new CliValidationObservation("normalized-answer", normalizedAnswer),
                        new CliValidationObservation("stdout", commandResult.stdout().trim()),
                        new CliValidationObservation("stderr", commandResult.stderr().trim())
                ),
                List.of()
        );
    }

    private static void prepareWorkspace(Path workspace, GitCommandProbeConfig.GitWorkspaceTemplate template)
            throws IOException, InterruptedException {
        runCommand(List.of(resolveGitExecutable(), "init", "-b", template.initialBranch()), workspace);
        runCommand(List.of(resolveGitExecutable(), "config", "user.name", "gitTrainer"), workspace);
        runCommand(List.of(resolveGitExecutable(), "config", "user.email", "trainer@example.com"), workspace);

        for (GitCommandProbeConfig.GitWorkspaceFile file : template.committedFiles()) {
            writeFile(workspace, file);
        }

        runCommand(List.of(resolveGitExecutable(), "add", "."), workspace);
        runCommand(List.of(resolveGitExecutable(), "commit", "-m", "initial fixture"), workspace);

        for (String branch : template.branches()) {
            if (!branch.equals(template.initialBranch()) && !branch.equals(template.currentBranch())) {
                runCommand(List.of(resolveGitExecutable(), "branch", branch), workspace);
            }
        }

        if (!template.currentBranch().equals(template.initialBranch())) {
            runCommand(List.of(resolveGitExecutable(), "checkout", "-b", template.currentBranch()), workspace);
        }

        for (GitCommandProbeConfig.GitWorkspaceFile file : template.modifiedFiles()) {
            writeFile(workspace, file);
        }
        for (GitCommandProbeConfig.GitWorkspaceFile file : template.untrackedFiles()) {
            writeFile(workspace, file);
        }
    }

    private static void writeFile(Path workspace, GitCommandProbeConfig.GitWorkspaceFile file) throws IOException {
        Path target = workspace.resolve(file.path()).normalize();
        Files.createDirectories(target.getParent());
        Files.writeString(target, file.content(), StandardCharsets.UTF_8);
    }

    private static CommandResult runCommand(List<String> tokens, Path workspace)
            throws IOException, InterruptedException {
        Process process = new ProcessBuilder(tokens)
                .directory(workspace.toFile())
                .redirectErrorStream(false)
                .start();
        int exitCode = process.waitFor();
        String stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        String stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
        return new CommandResult(exitCode, stdout, stderr);
    }

    private static List<String> tokenizeGitCommand(String rawCommand) {
        String normalized = rawCommand == null ? "" : rawCommand.trim();
        if (normalized.isBlank()) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-invalid-command",
                    "CLI validator получил пустую git-команду."
            );
        }
        boolean containsShellControl = normalized.chars().anyMatch(character ->
                character == ';'
                        || character == '&'
                        || character == '|'
                        || character == '>'
                        || character == '<'
                        || character == '`'
                        || character == '\n'
                        || character == '\r'
        );
        if (containsShellControl) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-invalid-command",
                    "CLI validator принимает только прямые git-команды без shell-операторов."
            );
        }

        List<String> tokens = new ArrayList<>(List.of(normalized.split("\\s+")));
        if (tokens.isEmpty() || !"git".equals(tokens.getFirst().toLowerCase(Locale.ROOT))) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-invalid-command",
                    "CLI validator принимает только команды, начинающиеся с `git`."
            );
        }
        tokens.forEach(token -> {
            if (token.contains("\"") || token.contains("'") || token.contains("$(")) {
                throw new ValidationRunnerExecutionException(
                        "validation-runner-invalid-command",
                        "CLI validator пока не поддерживает shell-quoted аргументы."
                );
            }
        });
        tokens.set(0, resolveGitExecutable());
        return tokens;
    }

    private static String resolveGitExecutable() {
        List<String> candidates = List.of(
                "/usr/bin/git",
                "/opt/homebrew/bin/git",
                "/usr/local/bin/git",
                "git"
        );

        return candidates.stream()
                .filter(candidate -> "git".equals(candidate)
                        || (Files.isRegularFile(Path.of(candidate)) && Files.isExecutable(Path.of(candidate))))
                .findFirst()
                .orElseThrow(() -> new ValidationRunnerExecutionException(
                        "validation-runner-git-not-found",
                        "CLI validator не нашёл исполняемый файл git."
                ));
    }

    private static void deleteRecursively(Path root) {
        if (root == null || !Files.exists(root)) {
            return;
        }
        try (var paths = Files.walk(root)) {
            paths.sorted((left, right) -> right.compareTo(left))
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException ignored) {
                            // best-effort cleanup for temporary git workspace
                        }
                    });
        } catch (IOException ignored) {
            // best-effort cleanup for temporary git workspace
        }
    }

    private record CommandResult(
            int exitCode,
            String stdout,
            String stderr
    ) {
    }
}
