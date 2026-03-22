package com.example.gittrainer.validation.cli;

import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;

import java.util.List;
import java.util.Map;

public record GitRepoStateProbeConfig(
        int expectedExitCode,
        RemoteSyncWorkspaceTemplate workspaceTemplate,
        ExpectedRepoState expectedState
) {

    @SuppressWarnings("unchecked")
    public static GitRepoStateProbeConfig from(Map<String, Object> config) {
        if (config == null || config.isEmpty()) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-invalid-config",
                    "git_repo_state_probe требует config payload."
            );
        }

        Object expectedExitCode = config.get("expectedExitCode");
        Object workspaceTemplate = config.get("workspaceTemplate");
        Object expectedState = config.get("expectedState");
        if (expectedExitCode == null
                || !(workspaceTemplate instanceof Map<?, ?> workspaceTemplateMap)
                || !(expectedState instanceof Map<?, ?> expectedStateMap)) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-invalid-config",
                    "git_repo_state_probe получил неполный config payload."
            );
        }

        return new GitRepoStateProbeConfig(
                Integer.parseInt(String.valueOf(expectedExitCode)),
                RemoteSyncWorkspaceTemplate.from((Map<String, Object>) workspaceTemplateMap),
                ExpectedRepoState.from((Map<String, Object>) expectedStateMap)
        );
    }

    public record RemoteSyncWorkspaceTemplate(
            String initialBranch,
            String remoteName,
            String localAheadCommitMessage,
            String remoteAheadCommitMessage,
            List<WorkspaceFile> baseFiles,
            List<WorkspaceFile> localAheadFiles,
            List<WorkspaceFile> remoteAheadFiles
    ) {

        static RemoteSyncWorkspaceTemplate from(Map<String, Object> payload) {
            return new RemoteSyncWorkspaceTemplate(
                    stringValue(payload, "initialBranch"),
                    stringValue(payload, "remoteName"),
                    stringValue(payload, "localAheadCommitMessage"),
                    stringValue(payload, "remoteAheadCommitMessage"),
                    files(payload, "baseFiles"),
                    files(payload, "localAheadFiles"),
                    files(payload, "remoteAheadFiles")
            );
        }
    }

    public record ExpectedRepoState(
            String currentBranch,
            String localHeadCommitMessage,
            String fetchHeadCommitMessage,
            List<ExpectedRemoteTrackingRef> remoteTrackingRefs
    ) {

        static ExpectedRepoState from(Map<String, Object> payload) {
            return new ExpectedRepoState(
                    stringValue(payload, "currentBranch"),
                    stringValue(payload, "localHeadCommitMessage"),
                    stringValue(payload, "fetchHeadCommitMessage"),
                    parseRemoteTrackingRefs(payload)
            );
        }
    }

    public record ExpectedRemoteTrackingRef(
            String ref,
            String commitMessage
    ) {

        static ExpectedRemoteTrackingRef from(Map<String, Object> payload) {
            return new ExpectedRemoteTrackingRef(
                    stringValue(payload, "ref"),
                    stringValue(payload, "commitMessage")
            );
        }
    }

    public record WorkspaceFile(
            String path,
            String content
    ) {

        static WorkspaceFile from(Map<String, Object> payload) {
            return new WorkspaceFile(
                    stringValue(payload, "path"),
                    String.valueOf(payload.getOrDefault("content", ""))
            );
        }
    }

    @SuppressWarnings("unchecked")
    private static List<WorkspaceFile> files(Map<String, Object> payload, String key) {
        Object rawValue = payload.get(key);
        if (!(rawValue instanceof List<?> rawFiles)) {
            return List.of();
        }

        return rawFiles.stream()
                .map(Map.class::cast)
                .map(file -> WorkspaceFile.from((Map<String, Object>) file))
                .toList();
    }

    @SuppressWarnings("unchecked")
    private static List<ExpectedRemoteTrackingRef> parseRemoteTrackingRefs(Map<String, Object> payload) {
        Object rawValue = payload.get("remoteTrackingRefs");
        if (!(rawValue instanceof List<?> rawRefs)) {
            return List.of();
        }

        return rawRefs.stream()
                .map(Map.class::cast)
                .map(ref -> ExpectedRemoteTrackingRef.from((Map<String, Object>) ref))
                .toList();
    }

    private static String stringValue(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value == null) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-invalid-config",
                    "В config payload отсутствует обязательное поле `" + key + "`."
            );
        }
        return String.valueOf(value);
    }
}
