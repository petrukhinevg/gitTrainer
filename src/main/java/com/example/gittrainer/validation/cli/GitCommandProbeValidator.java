package com.example.gittrainer.validation.cli;

import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

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
                    request.priorAnswers(),
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

            if (config.expectedStdout() != null && !config.expectedStdout().equals(commandResult.stdout().trim())) {
                return mismatchResponse(
                        commandSequence.normalizedAnswer(),
                        "git-command-output-mismatch",
                        "Команда не подтвердила ожидаемое состояние репозитория.",
                        commandResult
                );
            }
            if (config.expectedWorkspaceState() != null) {
                ObservedWorkspaceState observedWorkspaceState = observeWorkspaceState(workspace);
                if (!matches(config.expectedWorkspaceState(), observedWorkspaceState)) {
                    return partialStateResponse(
                            commandSequence.normalizedAnswer(),
                            commandSequence.matchedRule(),
                            observedWorkspaceState
                    );
                }
            }
            if (!hasRequiredHistory(config, commandSequence.normalizedAnswer(), request.priorAnswers())) {
                return missingHistoryResponse(commandSequence.normalizedAnswer());
            }

            return new CliValidationResponse(
                "evaluated",
                    commandSequence.matchedRule().correctness(),
                    commandSequence.matchedRule().code(),
                    commandSequence.matchedRule().message(),
                    successObservations(commandSequence.normalizedAnswer(), commandResult, config, workspace),
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
            List<com.example.gittrainer.session.domain.SubmittedAnswer> priorAnswers,
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
            if (config.expectedStdout() != null && !config.expectedStdout().equals(commandResult.stdout().trim())) {
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
            if (config.expectedWorkspaceState() != null) {
                ObservedWorkspaceState observedWorkspaceState = observeWorkspaceState(workspace);
                if (!matches(config.expectedWorkspaceState(), observedWorkspaceState)) {
                    return partialStateResponse(normalizedAnswer, matchedRule, observedWorkspaceState);
                }
            }
            if (!hasRequiredHistory(config, normalizedAnswer, priorAnswers)) {
                return missingHistoryResponse(normalizedAnswer);
            }

            return new CliValidationResponse(
                    "evaluated",
                    matchedRule.correctness(),
                    matchedRule.code(),
                    matchedRule.message(),
                    successObservations(normalizedAnswer, commandResult, config, workspace),
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

    private static List<CliValidationObservation> successObservations(
            String normalizedAnswer,
            GitCliSupport.CommandResult commandResult,
            GitCommandProbeConfig config,
            Path workspace
    ) throws IOException, InterruptedException {
        List<CliValidationObservation> observations = new ArrayList<>();
        observations.add(new CliValidationObservation("normalized-answer", normalizedAnswer));
        observations.add(new CliValidationObservation("stdout", commandResult.stdout().trim()));
        if (config.expectedStdout() != null) {
            observations.add(new CliValidationObservation("workspace-branch", config.expectedStdout()));
        }
        if (config.expectedWorkspaceState() != null) {
            ObservedWorkspaceState observedWorkspaceState = observeWorkspaceState(workspace);
            observations.addAll(workspaceObservations(observedWorkspaceState));
        }
        return List.copyOf(observations);
    }

    private static CliValidationResponse partialStateResponse(
            String normalizedAnswer,
            com.example.gittrainer.validation.application.ScenarioValidationRule matchedRule,
            ObservedWorkspaceState observedWorkspaceState
    ) {
        return new CliValidationResponse(
                "evaluated",
                "partial".equals(matchedRule.correctness()) ? matchedRule.correctness() : "partial",
                "partial".equals(matchedRule.correctness()) ? matchedRule.code() : "git-command-state-incomplete",
                "partial".equals(matchedRule.correctness())
                        ? matchedRule.message()
                        : "Команда допустима, но состояние workspace ещё не достигло целевого результата.",
                workspaceObservations(normalizedAnswer, observedWorkspaceState),
                List.of(),
                null
        );
    }

    private static CliValidationResponse missingHistoryResponse(String normalizedAnswer) {
        return new CliValidationResponse(
                "evaluated",
                "partial",
                "git-command-history-incomplete",
                "Команда допустима, но перед ней не хватает предыдущего шага чтения контекста.",
                List.of(new CliValidationObservation("normalized-answer", normalizedAnswer)),
                List.of(),
                null
        );
    }

    private static ObservedWorkspaceState observeWorkspaceState(Path workspace)
            throws IOException, InterruptedException {
        String branch = GitCliSupport.readGitStdout(workspace, "branch", "--show-current");
        String status = GitCliSupport.readGitStdout(workspace, "status", "--short");
        String stashList = GitCliSupport.readGitStdout(workspace, "stash", "list");
        String tagList = GitCliSupport.readGitStdout(workspace, "tag", "--list");
        int stashEntryCount = stashList == null || stashList.isBlank()
                ? 0
                : (int) stashList.lines().filter(line -> !line.isBlank()).count();
        int tagCount = tagList == null || tagList.isBlank()
                ? 0
                : (int) tagList.lines().filter(line -> !line.isBlank()).count();
        return new ObservedWorkspaceState(
                branch,
                status == null || status.isBlank(),
                stashEntryCount,
                tagCount
        );
    }

    private static boolean matches(
            GitCommandProbeConfig.ExpectedWorkspaceState expectedWorkspaceState,
            ObservedWorkspaceState observedWorkspaceState
    ) {
        if (expectedWorkspaceState.currentBranch() != null
                && !expectedWorkspaceState.currentBranch().equals(observedWorkspaceState.currentBranch())) {
            return false;
        }
        if (expectedWorkspaceState.workingTreeClean() != null
                && !expectedWorkspaceState.workingTreeClean().equals(observedWorkspaceState.workingTreeClean())) {
            return false;
        }
        if (expectedWorkspaceState.stashEntryCount() != null
                && !expectedWorkspaceState.stashEntryCount().equals(observedWorkspaceState.stashEntryCount())) {
            return false;
        }
        return expectedWorkspaceState.tagCount() == null
                || expectedWorkspaceState.tagCount().equals(observedWorkspaceState.tagCount());
    }

    private static boolean hasRequiredHistory(
            GitCommandProbeConfig config,
            String normalizedAnswer,
            List<com.example.gittrainer.session.domain.SubmittedAnswer> priorAnswers
    ) {
        List<String> requiredCommands = config.requiredPriorCommandsByCommand().get(normalizedAnswer);
        if (requiredCommands == null || requiredCommands.isEmpty()) {
            return true;
        }
        Set<String> priorNormalizedAnswers = priorAnswers.stream()
                .filter(answer -> "command_text".equals(answer.type()))
                .map(com.example.gittrainer.session.domain.SubmittedAnswer::value)
                .map(com.example.gittrainer.validation.application.CommandTextNormalizer::normalize)
                .collect(java.util.stream.Collectors.toSet());
        return requiredCommands.stream().allMatch(priorNormalizedAnswers::contains);
    }

    private static List<CliValidationObservation> workspaceObservations(
            String normalizedAnswer,
            ObservedWorkspaceState observedWorkspaceState
    ) {
        List<CliValidationObservation> observations = new ArrayList<>();
        observations.add(new CliValidationObservation("normalized-answer", normalizedAnswer));
        observations.addAll(workspaceObservations(observedWorkspaceState));
        return List.copyOf(observations);
    }

    private static List<CliValidationObservation> workspaceObservations(ObservedWorkspaceState observedWorkspaceState) {
        return List.of(
                new CliValidationObservation(
                        "current-branch", valueOrMissing(observedWorkspaceState.currentBranch())),
                new CliValidationObservation(
                        "working-tree-clean", String.valueOf(observedWorkspaceState.workingTreeClean())),
                new CliValidationObservation(
                        "stash-entry-count", String.valueOf(observedWorkspaceState.stashEntryCount())),
                new CliValidationObservation(
                        "tag-count", String.valueOf(observedWorkspaceState.tagCount()))
        );
    }

    private static String valueOrMissing(String value) {
        return value == null || value.isBlank() ? "<missing>" : value;
    }

    private record ObservedWorkspaceState(
            String currentBranch,
            boolean workingTreeClean,
            int stashEntryCount,
            int tagCount
    ) {
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
        for (String tag : template.tags()) {
            GitCliSupport.runCommand(GitCliSupport.gitCommand("tag", tag), workspace);
        }

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
