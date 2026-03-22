package com.example.gittrainer.validation.cli;

import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;

import java.util.List;
import java.util.Map;

public record GitCommandProbeConfig(
        int expectedExitCode,
        String expectedStdout,
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
        Object workspaceTemplate = config.get("workspaceTemplate");
        if (!(workspaceTemplate instanceof Map<?, ?> workspaceTemplateMap)
                || expectedStdout == null
                || expectedExitCode == null) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-invalid-config",
                    "git_command_probe получил неполный config payload."
            );
        }

        return new GitCommandProbeConfig(
                Integer.parseInt(String.valueOf(expectedExitCode)),
                String.valueOf(expectedStdout),
                GitWorkspaceTemplate.from((Map<String, Object>) workspaceTemplateMap)
        );
    }

    public record GitWorkspaceTemplate(
            String initialBranch,
            String currentBranch,
            List<String> branches,
            List<GitWorkspaceFile> committedFiles,
            List<GitWorkspaceFile> modifiedFiles,
            List<GitWorkspaceFile> untrackedFiles
    ) {

        @SuppressWarnings("unchecked")
        static GitWorkspaceTemplate from(Map<String, Object> payload) {
            return new GitWorkspaceTemplate(
                    stringValue(payload, "initialBranch"),
                    stringValue(payload, "currentBranch"),
                    (List<String>) payload.getOrDefault("branches", List.of()),
                    files(payload, "committedFiles"),
                    files(payload, "modifiedFiles"),
                    files(payload, "untrackedFiles")
            );
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
