package com.example.gittrainer.validation.cli;

import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public final class GitCommandProbeValidator {

    private static final String GIT_COMMAND_PROBE = "git_command_probe";

    private GitCommandProbeValidator() {
    }

    public static CliValidationResponse handle(CliValidationRequest request) {
        GitCommandProbeConfig config = GitCommandProbeConfig.from(request.spec().config());
        GitValidationCommandSequence.PreparedCommandSequence commandSequence =
                GitValidationCommandSequence.prepare(request);
        if (commandSequence.matchedRule() == null) {
            return new CliValidationResponse(
                    "evaluated",
                    "incorrect",
                    "unexpected-command",
                    "Отправленная команда не совпадает с ожидаемым безопасным следующим шагом для этого сценария.",
                    List.of(new CliValidationObservation("normalized-answer", commandSequence.normalizedAnswer())),
                    List.of(),
                    null
            );
        }

        Path persistedWorkspace = workspacePath(request);
        if (persistedWorkspace != null) {
            return executeAgainstWorkspace(
                    persistedWorkspace,
                    commandSequence.normalizedAnswer(),
                    commandSequence.matchedRule(),
                    GitCliSupport.tokenizeGitCommand(request.answer().value()),
                    config
            );
        }

        Path workspace = null;
        try {
            workspace = Files.createTempDirectory("git-validator-workspace-");
            prepareWorkspace(workspace, config.workspaceTemplate());
            GitCliSupport.CommandResult commandResult = null;
            for (List<String> tokens : commandSequence.commandTokens()) {
                commandResult = GitCliSupport.runCommand(tokens, workspace);
                if (commandResult.exitCode() != config.expectedExitCode()) {
                    return mismatchResponse(
                            commandSequence.normalizedAnswer(),
                            "git-command-exit-mismatch",
                            "Команда выполнилась не так, как ожидается для этого сценария.",
                            commandResult
                    );
                }
            }
            if (commandResult == null) {
                return mismatchResponse(
                        commandSequence.normalizedAnswer(),
                        "git-command-missing-history",
                        "Не нашлось ни одной разрешённой git-команды для воспроизведения состояния сценария.",
                        new GitCliSupport.CommandResult(config.expectedExitCode(), "", "")
                );
            }

            if (!config.expectedStdout().equals(commandResult.stdout().trim())) {
                return mismatchResponse(
                        commandSequence.normalizedAnswer(),
                        "git-command-output-mismatch",
                        "Команда не подтвердила ожидаемое состояние репозитория.",
                        commandResult
                );
            }

            return new CliValidationResponse(
                "evaluated",
                    commandSequence.matchedRule().correctness(),
                    commandSequence.matchedRule().code(),
                    commandSequence.matchedRule().message(),
                    List.of(
                            new CliValidationObservation("normalized-answer", commandSequence.normalizedAnswer()),
                            new CliValidationObservation("stdout", commandResult.stdout().trim()),
                            new CliValidationObservation("workspace-branch", config.expectedStdout())
                    ),
                    List.of(),
                    null
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
            GitCliSupport.deleteRecursively(workspace);
        }
    }

    public static boolean supports(String validatorType) {
        return GIT_COMMAND_PROBE.equals(validatorType);
    }

    private static CliValidationResponse executeAgainstWorkspace(
            Path workspace,
            String normalizedAnswer,
            com.example.gittrainer.validation.application.ScenarioValidationRule matchedRule,
            List<String> tokens,
            GitCommandProbeConfig config
    ) {
        try {
            GitCliSupport.CommandResult commandResult = GitCliSupport.runCommand(tokens, workspace);
            if (commandResult.exitCode() != config.expectedExitCode()) {
                return mismatchResponse(
                        normalizedAnswer,
                        "git-command-exit-mismatch",
                        "Команда выполнилась не так, как ожидается для этого сценария.",
                        commandResult
                );
            }
            if (!config.expectedStdout().equals(commandResult.stdout().trim())) {
                return new CliValidationResponse(
                        "evaluated",
                        "partial",
                        "git-command-state-incomplete",
                        "Команда допустима, но состояние workspace ещё не достигло целевого результата.",
                        List.of(
                                new CliValidationObservation("normalized-answer", normalizedAnswer),
                                new CliValidationObservation("stdout", commandResult.stdout().trim()),
                                new CliValidationObservation("workspace-branch", config.expectedStdout())
                        ),
                        List.of(),
                        null
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
                    List.of(),
                    null
            );
        } catch (IOException exception) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-workspace-setup-failed",
                    "Не удалось использовать session-backed workspace для command probe validator.",
                    exception
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ValidationRunnerExecutionException(
                    "validation-runner-command-interrupted",
                    "Проверка git-команды была прервана.",
                    exception
            );
        }
    }

    private static Path workspacePath(CliValidationRequest request) {
        if (request.workspacePath() == null) {
            return null;
        }
        Path workspace = Path.of(request.workspacePath());
        return Files.isDirectory(workspace) ? workspace : null;
    }

    private static CliValidationResponse mismatchResponse(
            String normalizedAnswer,
            String code,
            String message,
            GitCliSupport.CommandResult commandResult
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
                List.of(),
                null
        );
    }

    static void prepareWorkspace(Path workspace, GitCommandProbeConfig.GitWorkspaceTemplate template)
            throws IOException, InterruptedException {
        GitCliSupport.runCommand(GitCliSupport.gitCommand("init", "-b", template.initialBranch()), workspace);
        GitCliSupport.runCommand(GitCliSupport.gitCommand("config", "user.name", "gitTrainer"), workspace);
        GitCliSupport.runCommand(GitCliSupport.gitCommand("config", "user.email", "trainer@example.com"), workspace);

        for (GitCommandProbeConfig.GitWorkspaceFile file : template.committedFiles()) {
            writeFile(workspace, file);
        }

        GitCliSupport.runCommand(GitCliSupport.gitCommand("add", "."), workspace);
        GitCliSupport.runCommand(GitCliSupport.gitCommand("commit", "-m", "initial fixture"), workspace);

        for (String branch : template.branches()) {
            if (!branch.equals(template.initialBranch()) && !branch.equals(template.currentBranch())) {
                GitCliSupport.runCommand(GitCliSupport.gitCommand("branch", branch), workspace);
            }
        }

        if (!template.currentBranch().equals(template.initialBranch())) {
            GitCliSupport.runCommand(GitCliSupport.gitCommand("checkout", "-b", template.currentBranch()), workspace);
        }

        for (GitCommandProbeConfig.GitWorkspaceFile file : template.modifiedFiles()) {
            writeFile(workspace, file);
        }
        for (GitCommandProbeConfig.GitWorkspaceFile file : template.untrackedFiles()) {
            writeFile(workspace, file);
        }
    }

    private static void writeFile(Path workspace, GitCommandProbeConfig.GitWorkspaceFile file) throws IOException {
        GitCliSupport.writeFile(workspace, file.path(), file.content());
    }
}
