package com.example.gittrainer.validation.cli;

import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

final class GitCliSupport {

    private GitCliSupport() {
    }

    static List<String> gitCommand(String... args) {
        List<String> command = new ArrayList<>(args.length + 1);
        command.add(resolveGitExecutable());
        command.addAll(List.of(args));
        return List.copyOf(command);
    }

    static CommandResult runCommand(List<String> tokens, Path workingDirectory)
            throws IOException, InterruptedException {
        Process process = new ProcessBuilder(tokens)
                .directory(workingDirectory.toFile())
                .redirectErrorStream(false)
                .start();
        int exitCode = process.waitFor();
        String stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        String stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
        return new CommandResult(exitCode, stdout, stderr);
    }

    static CommandResult runRequiredCommand(
            List<String> tokens,
            Path workingDirectory,
            String code,
            String message
    ) throws IOException, InterruptedException {
        CommandResult result = runCommand(tokens, workingDirectory);
        if (result.exitCode() != 0) {
            throw new ValidationRunnerExecutionException(code, messageWithStderr(message, result.stderr()));
        }
        return result;
    }

    static String readGitStdout(Path workingDirectory, String... args)
            throws IOException, InterruptedException {
        CommandResult result = runCommand(gitCommand(args), workingDirectory);
        if (result.exitCode() != 0) {
            return null;
        }
        return result.stdout().trim();
    }

    static void writeFile(Path root, String relativePath, String content) throws IOException {
        Path target = root.resolve(relativePath).normalize();
        Path parent = target.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
        Files.writeString(target, content, StandardCharsets.UTF_8);
    }

    static List<String> tokenizeGitCommand(String rawCommand) {
        String normalized = rawCommand == null ? "" : rawCommand.trim();
        if (normalized.isBlank()) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-empty-command",
                    "Введите одну Git-команду, например `git status`."
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
                    "validation-runner-shell-operators-not-supported",
                    "Введите одну Git-команду без `;`, `&&`, пайпов и других shell-операторов."
            );
        }

        if (normalized.contains("$(")) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-quoted-args-not-supported",
                    "Shell-подстановки вроде `$(...)` не поддерживаются."
            );
        }

        List<String> tokens = splitGitCommandTokens(normalized);
        if (tokens.isEmpty() || !"git".equals(tokens.getFirst().toLowerCase(Locale.ROOT))) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-command-must-start-with-git",
                    "Команда должна начинаться с `git`, например `git status`."
            );
        }
        tokens.set(0, resolveGitExecutable());
        return tokens;
    }

    private static List<String> splitGitCommandTokens(String rawCommand) {
        List<String> tokens = new ArrayList<>();
        StringBuilder currentToken = new StringBuilder();
        Character activeQuote = null;

        for (int index = 0; index < rawCommand.length(); index += 1) {
            char character = rawCommand.charAt(index);
            if (activeQuote != null) {
                if (character == activeQuote) {
                    activeQuote = null;
                    continue;
                }
                if (
                        character == '\\'
                                && activeQuote == '"'
                                && index + 1 < rawCommand.length()
                ) {
                    char escapedCharacter = rawCommand.charAt(index + 1);
                    if (escapedCharacter == '"' || escapedCharacter == '\\') {
                        currentToken.append(escapedCharacter);
                        index += 1;
                        continue;
                    }
                }
                currentToken.append(character);
                continue;
            }

            if (Character.isWhitespace(character)) {
                flushGitCommandToken(tokens, currentToken);
                continue;
            }

            if (character == '"' || character == '\'') {
                activeQuote = character;
                continue;
            }

            currentToken.append(character);
        }

        if (activeQuote != null) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-quoted-args-not-supported",
                    "Команда содержит незакрытую кавычку."
            );
        }

        flushGitCommandToken(tokens, currentToken);
        return tokens;
    }

    private static void flushGitCommandToken(List<String> tokens, StringBuilder currentToken) {
        if (currentToken.isEmpty()) {
            return;
        }
        tokens.add(currentToken.toString());
        currentToken.setLength(0);
    }

    static String resolveGitExecutable() {
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

    static void deleteRecursively(Path root) {
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

    private static String messageWithStderr(String message, String stderr) {
        String normalizedStderr = stderr == null ? "" : stderr.trim();
        if (normalizedStderr.isBlank()) {
            return message;
        }
        return message + " stderr: " + normalizedStderr;
    }

    record CommandResult(
            int exitCode,
            String stdout,
            String stderr
    ) {
    }
}
