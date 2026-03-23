package com.example.gittrainer.validation.cli;

import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;

import java.util.List;
import java.util.Map;

public record GitCommandProbeConfig(
        int expectedExitCode,
        String expectedStdout,
        ExpectedWorkspaceState expectedWorkspaceState,
        Map<String, List<String>> requiredPriorCommandsByCommand,
        GitWorkspaceTemplate workspaceTemplate
) {

    @SuppressWarnings("unchecked")
    public static GitCommandProbeConfig from(Map<String, Object> config) {
        if (config == null || config.isEmpty()) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-invalid-config",
                    "git_command_probe требует config payload."
            );
        }

        Object expectedExitCode = config.get("expectedExitCode");
        Object expectedStdout = config.get("expectedStdout");
        Object expectedWorkspaceState = config.get("expectedWorkspaceState");
        Object requiredPriorCommandsByCommand = config.get("requiredPriorCommandsByCommand");
        Object workspaceTemplate = config.get("workspaceTemplate");
        if (!(workspaceTemplate instanceof Map<?, ?> workspaceTemplateMap)
                || expectedExitCode == null
                || (expectedStdout == null && !(expectedWorkspaceState instanceof Map<?, ?>))) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-invalid-config",
                    "git_command_probe получил неполный config payload."
            );
        }

        return new GitCommandProbeConfig(
                Integer.parseInt(String.valueOf(expectedExitCode)),
                expectedStdout == null ? null : String.valueOf(expectedStdout),
                expectedWorkspaceState instanceof Map<?, ?> expectedWorkspaceStateMap
                        ? ExpectedWorkspaceState.from((Map<String, Object>) expectedWorkspaceStateMap)
                        : null,
                requiredPriorCommands(requiredPriorCommandsByCommand),
                GitWorkspaceTemplate.from((Map<String, Object>) workspaceTemplateMap)
        );
    }

    @SuppressWarnings("unchecked")
    private static Map<String, List<String>> requiredPriorCommands(Object rawValue) {
        if (!(rawValue instanceof Map<?, ?> rawRequirements)) {
            return Map.of();
        }
        return ((Map<String, Object>) rawRequirements).entrySet().stream()
                .collect(java.util.stream.Collectors.toUnmodifiableMap(
                        Map.Entry::getKey,
                        entry -> ((List<?>) entry.getValue()).stream()
                                .map(String::valueOf)
                                .toList()
                ));
    }

    public record ExpectedWorkspaceState(
            String currentBranch,
            Boolean workingTreeClean,
            Integer stashEntryCount,
            Integer tagCount
    ) {

        static ExpectedWorkspaceState from(Map<String, Object> payload) {
            return new ExpectedWorkspaceState(
                    optionalStringValue(payload, "currentBranch"),
                    optionalBooleanValue(payload, "workingTreeClean"),
                    optionalIntegerValue(payload, "stashEntryCount"),
                    optionalIntegerValue(payload, "tagCount")
            );
        }

        private static String optionalStringValue(Map<String, Object> payload, String key) {
            Object value = payload.get(key);
            return value == null ? null : String.valueOf(value);
        }

        private static Boolean optionalBooleanValue(Map<String, Object> payload, String key) {
            Object value = payload.get(key);
            return value == null ? null : Boolean.parseBoolean(String.valueOf(value));
        }

        private static Integer optionalIntegerValue(Map<String, Object> payload, String key) {
            Object value = payload.get(key);
            return value == null ? null : Integer.parseInt(String.valueOf(value));
        }
    }

    public record GitWorkspaceTemplate(
            String initialBranch,
            String currentBranch,
            List<String> branches,
            List<GitWorkspaceFile> committedFiles,
            List<GitWorkspaceFile> modifiedFiles,
            List<GitWorkspaceFile> untrackedFiles,
            List<String> tags
    ) {

        @SuppressWarnings("unchecked")
        static GitWorkspaceTemplate from(Map<String, Object> payload) {
            return new GitWorkspaceTemplate(
                    stringValue(payload, "initialBranch"),
                    stringValue(payload, "currentBranch"),
                    (List<String>) payload.getOrDefault("branches", List.of()),
                    files(payload, "committedFiles"),
                    files(payload, "modifiedFiles"),
                    files(payload, "untrackedFiles"),
                    tags(payload)
            );
        }

        @SuppressWarnings("unchecked")
        private static List<String> tags(Map<String, Object> payload) {
            Object rawValue = payload.get("tags");
            if (!(rawValue instanceof List<?> rawTags)) {
                return List.of();
            }
            return ((List<Object>) rawTags).stream()
                    .map(String::valueOf)
                    .toList();
        }

        private static List<GitWorkspaceFile> files(Map<String, Object> payload, String key) {
            Object rawValue = payload.get(key);
            if (!(rawValue instanceof List<?> rawFiles)) {
                return List.of();
            }

            return rawFiles.stream()
                    .map(Map.class::cast)
                    .map(GitWorkspaceFile::from)
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

    public record GitWorkspaceFile(
            String path,
            String content
    ) {

        static GitWorkspaceFile from(Map<String, Object> payload) {
            return new GitWorkspaceFile(
                    String.valueOf(payload.get("path")),
                    String.valueOf(payload.getOrDefault("content", ""))
            );
        }
    }
}
