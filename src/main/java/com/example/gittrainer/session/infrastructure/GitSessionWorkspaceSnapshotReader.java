package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.SessionWorkspaceManager;
import com.example.gittrainer.session.application.SessionWorkspaceSnapshot;
import com.example.gittrainer.session.application.SessionWorkspaceSnapshotReader;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Component
public class GitSessionWorkspaceSnapshotReader implements SessionWorkspaceSnapshotReader {

    private static final int MAX_COMMITS = 6;

    private final SessionWorkspaceManager sessionWorkspaceManager;

    public GitSessionWorkspaceSnapshotReader(SessionWorkspaceManager sessionWorkspaceManager) {
        this.sessionWorkspaceManager = sessionWorkspaceManager;
    }

    @Override
    public Optional<SessionWorkspaceSnapshot> read(String sessionId) {
        return sessionWorkspaceManager.resolveWorkspacePath(sessionId)
                .map(this::inspectWorkspaceSafely);
    }

    private SessionWorkspaceSnapshot inspectWorkspaceSafely(Path workspace) {
        try {
            List<SessionWorkspaceSnapshot.Branch> branches = readBranches(workspace);
            List<SessionWorkspaceSnapshot.Commit> commits = readCommits(workspace);
            List<SessionWorkspaceSnapshot.FileEntry> files = readFiles(workspace);
            List<SessionWorkspaceSnapshot.Annotation> annotations = readAnnotations(workspace, branches, files);

            return new SessionWorkspaceSnapshot(
                    new SessionWorkspaceSnapshot.RepositoryContext(
                            "live-session",
                            branches,
                            commits,
                            files,
                            annotations
                    )
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return unavailableSnapshot();
        } catch (IOException exception) {
            return unavailableSnapshot();
        } catch (RuntimeException exception) {
            return unavailableSnapshot();
        }
    }

    private SessionWorkspaceSnapshot unavailableSnapshot() {
        return new SessionWorkspaceSnapshot(
                new SessionWorkspaceSnapshot.RepositoryContext(
                        "unavailable",
                        List.of(),
                        List.of(),
                        List.of(),
                        List.of(new SessionWorkspaceSnapshot.Annotation(
                                "Live workspace недоступен",
                                "Не удалось прочитать текущее состояние session-backed репозитория."
                        ))
                )
        );
    }

    private List<SessionWorkspaceSnapshot.Branch> readBranches(Path workspace)
            throws IOException, InterruptedException {
        CommandResult result = runGit(workspace, "branch", "--format=%(refname:short)|%(HEAD)");
        if (result.exitCode() != 0) {
            return List.of();
        }

        return result.stdout().lines()
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .map(this::toBranch)
                .sorted(Comparator.comparing(SessionWorkspaceSnapshot.Branch::current).reversed()
                        .thenComparing(SessionWorkspaceSnapshot.Branch::name))
                .toList();
    }

    private SessionWorkspaceSnapshot.Branch toBranch(String rawLine) {
        String[] parts = rawLine.split("\\|", 2);
        String name = parts.length > 0 ? parts[0].trim() : "";
        String headMarker = parts.length > 1 ? parts[1].trim() : "";
        return new SessionWorkspaceSnapshot.Branch(name, "*".equals(headMarker));
    }

    private List<SessionWorkspaceSnapshot.Commit> readCommits(Path workspace)
            throws IOException, InterruptedException {
        CommandResult result = runGit(workspace, "log", "--pretty=format:%h|%s", "-n", String.valueOf(MAX_COMMITS));
        if (result.exitCode() != 0) {
            return List.of();
        }

        return result.stdout().lines()
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .map(this::toCommit)
                .toList();
    }

    private SessionWorkspaceSnapshot.Commit toCommit(String rawLine) {
        String[] parts = rawLine.split("\\|", 2);
        String id = parts.length > 0 ? parts[0].trim() : "unknown";
        String summary = parts.length > 1 ? parts[1].trim() : "";
        return new SessionWorkspaceSnapshot.Commit(id, summary);
    }

    private List<SessionWorkspaceSnapshot.FileEntry> readFiles(Path workspace)
            throws IOException, InterruptedException {
        CommandResult result = runGit(workspace, "status", "--short", "--untracked-files=all");
        if (result.exitCode() != 0) {
            return List.of();
        }

        return result.stdout().lines()
                .map(this::toFileEntry)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();
    }

    private Optional<SessionWorkspaceSnapshot.FileEntry> toFileEntry(String rawLine) {
        if (rawLine == null || rawLine.isBlank() || rawLine.length() < 3) {
            return Optional.empty();
        }

        String code = rawLine.substring(0, 2);
        String path = rawLine.substring(3).trim();
        if (path.contains(" -> ")) {
            path = path.substring(path.lastIndexOf(" -> ") + 4).trim();
        }
        if (path.isBlank()) {
            return Optional.empty();
        }

        return Optional.of(new SessionWorkspaceSnapshot.FileEntry(path, normalizeFileStatus(code)));
    }

    private String normalizeFileStatus(String code) {
        String normalized = code == null ? "" : code.toUpperCase(Locale.ROOT);
        if ("??".equals(normalized)) {
            return "untracked";
        }
        if (normalized.indexOf('U') >= 0) {
            return "conflicted";
        }
        if (normalized.indexOf('R') >= 0) {
            return "renamed";
        }
        if (normalized.indexOf('D') >= 0) {
            return "deleted";
        }
        if (!normalized.isBlank() && normalized.charAt(0) != ' ' && normalized.charAt(1) == ' ') {
            return "staged";
        }
        if (normalized.indexOf('M') >= 0) {
            return "modified";
        }
        return "changed";
    }

    private List<SessionWorkspaceSnapshot.Annotation> readAnnotations(
            Path workspace,
            List<SessionWorkspaceSnapshot.Branch> branches,
            List<SessionWorkspaceSnapshot.FileEntry> files
    ) throws IOException, InterruptedException {
        List<SessionWorkspaceSnapshot.Annotation> annotations = new ArrayList<>();
        String currentBranch = branches.stream()
                .filter(SessionWorkspaceSnapshot.Branch::current)
                .map(SessionWorkspaceSnapshot.Branch::name)
                .findFirst()
                .orElse("неизвестно");

        annotations.add(new SessionWorkspaceSnapshot.Annotation(
                "Активная ветка",
                "Сессия сейчас открыта на `" + currentBranch + "`."
        ));

        if (files.isEmpty()) {
            annotations.add(new SessionWorkspaceSnapshot.Annotation(
                    "Рабочее дерево",
                    "Незакоммиченных изменений сейчас нет."
            ));
        } else {
            long untrackedCount = files.stream().filter(file -> "untracked".equals(file.status())).count();
            long modifiedCount = files.stream().filter(file -> "modified".equals(file.status())).count();
            long stagedCount = files.stream().filter(file -> "staged".equals(file.status())).count();
            annotations.add(new SessionWorkspaceSnapshot.Annotation(
                    "Рабочее дерево",
                    "Изменений: " + files.size()
                            + ", modified: " + modifiedCount
                            + ", staged: " + stagedCount
                            + ", untracked: " + untrackedCount + "."
            ));
        }

        int stashCount = countOutputLines(runGit(workspace, "stash", "list").stdout());
        if (stashCount > 0) {
            annotations.add(new SessionWorkspaceSnapshot.Annotation(
                    "Stash",
                    "В stash сохранено записей: " + stashCount + "."
            ));
        }

        int tagCount = countOutputLines(runGit(workspace, "tag", "--list").stdout());
        if (tagCount > 0) {
            annotations.add(new SessionWorkspaceSnapshot.Annotation(
                    "Теги",
                    "В репозитории доступно тегов: " + tagCount + "."
            ));
        }

        return List.copyOf(annotations);
    }

    private int countOutputLines(String stdout) {
        if (stdout == null || stdout.isBlank()) {
            return 0;
        }
        return (int) stdout.lines()
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .count();
    }

    private CommandResult runGit(Path workspace, String... args) throws IOException, InterruptedException {
        List<String> command = new ArrayList<>(args.length + 1);
        command.add(resolveGitExecutable());
        command.addAll(List.of(args));

        Process process = new ProcessBuilder(command)
                .directory(workspace.toFile())
                .start();
        int exitCode = process.waitFor();
        String stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        String stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
        return new CommandResult(exitCode, stdout, stderr);
    }

    private String resolveGitExecutable() {
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
                .orElse("git");
    }

    private record CommandResult(
            int exitCode,
            String stdout,
            String stderr
    ) {
    }
}
