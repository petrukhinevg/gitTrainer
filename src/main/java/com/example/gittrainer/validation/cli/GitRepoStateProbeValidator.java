package com.example.gittrainer.validation.cli;

import com.example.gittrainer.validation.application.CommandTextNormalizer;
import com.example.gittrainer.validation.application.ScenarioValidationRule;
import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public final class GitRepoStateProbeValidator {

    private static final String GIT_REPO_STATE_PROBE = "git_repo_state_probe";

    private GitRepoStateProbeValidator() {
    }

    public static CliValidationResponse handle(CliValidationRequest request) {
        GitRepoStateProbeConfig config = GitRepoStateProbeConfig.from(request.spec().config());
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

        Path root = null;
        try {
            root = Files.createTempDirectory("git-validator-state-workspace-");
            Path workspace = prepareWorkspace(root, config.workspaceTemplate());
            GitCliSupport.CommandResult commandResult = GitCliSupport.runCommand(
                    GitCliSupport.tokenizeGitCommand(request.answer().value()),
                    workspace
            );
            if (commandResult.exitCode() != config.expectedExitCode()) {
                return commandMismatchResponse(
                        normalizedAnswer,
                        "git-command-exit-mismatch",
                        "Команда выполнилась не так, как ожидается для этого сценария.",
                        commandResult
                );
            }

            ObservedRepoState observedState = observeState(workspace, config.expectedState());
            if (!matches(config.expectedState(), observedState)) {
                return repoStateMismatchResponse(normalizedAnswer, observedState);
            }

            return new CliValidationResponse(
                    "evaluated",
                    matchedRule.correctness(),
                    matchedRule.code(),
                    matchedRule.message(),
                    observations(normalizedAnswer, observedState),
                    List.of()
            );
        } catch (IOException exception) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-workspace-setup-failed",
                    "Не удалось подготовить временный git workspace для state probe validator.",
                    exception
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ValidationRunnerExecutionException(
                    "validation-runner-command-interrupted",
                    "State-based проверка git-команды была прервана.",
                    exception
            );
        } finally {
            GitCliSupport.deleteRecursively(root);
        }
    }

    public static boolean supports(String validatorType) {
        return GIT_REPO_STATE_PROBE.equals(validatorType);
    }

    private static Path prepareWorkspace(Path root, GitRepoStateProbeConfig.RemoteSyncWorkspaceTemplate template)
            throws IOException, InterruptedException {
        Path remoteRepository = root.resolve("origin.git");
        Path publisherWorkspace = root.resolve("publisher");
        Path studentWorkspace = root.resolve("workspace");

        GitCliSupport.runRequiredCommand(
                GitCliSupport.gitCommand("init", "--bare", remoteRepository.toString()),
                root,
                "validation-runner-workspace-setup-failed",
                "Не удалось создать bare remote для state probe validator."
        );
        GitCliSupport.runRequiredCommand(
                GitCliSupport.gitCommand("init", "-b", template.initialBranch(), publisherWorkspace.toString()),
                root,
                "validation-runner-workspace-setup-failed",
                "Не удалось создать publisher workspace для state probe validator."
        );
        configureUser(publisherWorkspace);
        writeFiles(publisherWorkspace, template.baseFiles());
        commitAll(publisherWorkspace, "initial fixture");
        GitCliSupport.runRequiredCommand(
                GitCliSupport.gitCommand("remote", "add", template.remoteName(), remoteRepository.toString()),
                publisherWorkspace,
                "validation-runner-workspace-setup-failed",
                "Не удалось привязать bare remote к publisher workspace."
        );
        GitCliSupport.runRequiredCommand(
                GitCliSupport.gitCommand("push", "-u", template.remoteName(), template.initialBranch()),
                publisherWorkspace,
                "validation-runner-workspace-setup-failed",
                "Не удалось опубликовать initial fixture в bare remote."
        );
        GitCliSupport.runRequiredCommand(
                GitCliSupport.gitCommand(
                        "--git-dir",
                        remoteRepository.toString(),
                        "symbolic-ref",
                        "HEAD",
                        "refs/heads/" + template.initialBranch()
                ),
                root,
                "validation-runner-workspace-setup-failed",
                "Не удалось выставить default branch для bare remote."
        );
        GitCliSupport.runRequiredCommand(
                GitCliSupport.gitCommand("clone", remoteRepository.toString(), studentWorkspace.toString()),
                root,
                "validation-runner-workspace-setup-failed",
                "Не удалось клонировать bare remote в student workspace."
        );
        configureUser(studentWorkspace);
        commitFiles(studentWorkspace, template.localAheadFiles(), template.localAheadCommitMessage());
        commitFiles(publisherWorkspace, template.remoteAheadFiles(), template.remoteAheadCommitMessage());
        GitCliSupport.runRequiredCommand(
                GitCliSupport.gitCommand("push", template.remoteName(), template.initialBranch()),
                publisherWorkspace,
                "validation-runner-workspace-setup-failed",
                "Не удалось опубликовать remote-ahead изменения."
        );

        return studentWorkspace;
    }

    private static void configureUser(Path workspace) throws IOException, InterruptedException {
        GitCliSupport.runRequiredCommand(
                GitCliSupport.gitCommand("config", "user.name", "gitTrainer"),
                workspace,
                "validation-runner-workspace-setup-failed",
                "Не удалось настроить git user.name для временного workspace."
        );
        GitCliSupport.runRequiredCommand(
                GitCliSupport.gitCommand("config", "user.email", "trainer@example.com"),
                workspace,
                "validation-runner-workspace-setup-failed",
                "Не удалось настроить git user.email для временного workspace."
        );
    }

    private static void commitFiles(
            Path workspace,
            List<GitRepoStateProbeConfig.WorkspaceFile> files,
            String commitMessage
    ) throws IOException, InterruptedException {
        if (files.isEmpty()) {
            return;
        }
        writeFiles(workspace, files);
        commitAll(workspace, commitMessage);
    }

    private static void writeFiles(Path workspace, List<GitRepoStateProbeConfig.WorkspaceFile> files)
            throws IOException {
        for (GitRepoStateProbeConfig.WorkspaceFile file : files) {
            GitCliSupport.writeFile(workspace, file.path(), file.content());
        }
    }

    private static void commitAll(Path workspace, String commitMessage) throws IOException, InterruptedException {
        GitCliSupport.runRequiredCommand(
                GitCliSupport.gitCommand("add", "."),
                workspace,
                "validation-runner-workspace-setup-failed",
                "Не удалось проиндексировать изменения во временном workspace."
        );
        GitCliSupport.runRequiredCommand(
                GitCliSupport.gitCommand("commit", "-m", commitMessage),
                workspace,
                "validation-runner-workspace-setup-failed",
                "Не удалось создать fixture commit во временном workspace."
        );
    }

    private static ObservedRepoState observeState(
            Path workspace,
            GitRepoStateProbeConfig.ExpectedRepoState expectedState
    )
            throws IOException, InterruptedException {
        List<ObservedRemoteTrackingRef> remoteTrackingRefs = new ArrayList<>();
        for (GitRepoStateProbeConfig.ExpectedRemoteTrackingRef expectedRef : expectedState.remoteTrackingRefs()) {
            remoteTrackingRefs.add(new ObservedRemoteTrackingRef(
                    expectedRef.ref(),
                    GitCliSupport.readGitStdout(workspace, "log", "-1", "--format=%s", expectedRef.ref())
            ));
        }

        return new ObservedRepoState(
                GitCliSupport.readGitStdout(workspace, "branch", "--show-current"),
                GitCliSupport.readGitStdout(workspace, "log", "-1", "--format=%s", "HEAD"),
                GitCliSupport.readGitStdout(workspace, "log", "-1", "--format=%s", "FETCH_HEAD"),
                remoteTrackingRefs
        );
    }

    private static boolean matches(
            GitRepoStateProbeConfig.ExpectedRepoState expectedState,
            ObservedRepoState observedState
    ) {
        if (!Objects.equals(expectedState.currentBranch(), observedState.currentBranch())) {
            return false;
        }
        if (!Objects.equals(expectedState.localHeadCommitMessage(), observedState.localHeadCommitMessage())) {
            return false;
        }
        if (!Objects.equals(expectedState.fetchHeadCommitMessage(), observedState.fetchHeadCommitMessage())) {
            return false;
        }

        return expectedState.remoteTrackingRefs().stream()
                .allMatch(expectedRef -> Objects.equals(
                        expectedRef.commitMessage(),
                        observedState.remoteTrackingCommitMessage(expectedRef.ref())
                ));
    }

    private static CliValidationResponse commandMismatchResponse(
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
                List.of()
        );
    }

    private static CliValidationResponse repoStateMismatchResponse(
            String normalizedAnswer,
            ObservedRepoState observedState
    ) {
        return new CliValidationResponse(
                "evaluated",
                "incorrect",
                "git-repo-state-mismatch",
                "Команда не привела репозиторий в ожидаемое post-fetch состояние.",
                observations(normalizedAnswer, observedState),
                List.of()
        );
    }

    private static List<CliValidationObservation> observations(
            String normalizedAnswer,
            ObservedRepoState observedState
    ) {
        List<CliValidationObservation> observations = new ArrayList<>();
        observations.add(new CliValidationObservation("normalized-answer", normalizedAnswer));
        observations.add(new CliValidationObservation("current-branch", valueOrMissing(observedState.currentBranch())));
        observations.add(new CliValidationObservation(
                "local-head-commit",
                valueOrMissing(observedState.localHeadCommitMessage())
        ));
        observations.add(new CliValidationObservation(
                "fetch-head-commit",
                valueOrMissing(observedState.fetchHeadCommitMessage())
        ));
        for (ObservedRemoteTrackingRef remoteTrackingRef : observedState.remoteTrackingRefs()) {
            observations.add(new CliValidationObservation(
                    "remote-tracking-ref",
                    remoteTrackingRef.ref() + "=" + valueOrMissing(remoteTrackingRef.commitMessage())
            ));
        }
        return List.copyOf(observations);
    }

    private static String valueOrMissing(String value) {
        if (value == null || value.isBlank()) {
            return "<missing>";
        }
        return value;
    }

    private record ObservedRepoState(
            String currentBranch,
            String localHeadCommitMessage,
            String fetchHeadCommitMessage,
            List<ObservedRemoteTrackingRef> remoteTrackingRefs
    ) {

        private String remoteTrackingCommitMessage(String ref) {
            return remoteTrackingRefs.stream()
                    .filter(remoteTrackingRef -> remoteTrackingRef.ref().equals(ref))
                    .map(ObservedRemoteTrackingRef::commitMessage)
                    .findFirst()
                    .orElse(null);
        }
    }

    private record ObservedRemoteTrackingRef(
            String ref,
            String commitMessage
    ) {
    }
}
