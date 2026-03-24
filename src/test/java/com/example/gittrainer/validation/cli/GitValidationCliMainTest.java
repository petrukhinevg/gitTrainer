package com.example.gittrainer.validation.cli;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.ScenarioValidationRule;
import com.example.gittrainer.validation.application.ScenarioValidationSpec;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GitValidationCliMainTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper().findAndRegisterModules();

    @Test
    void writesJsonOutcomeToStdoutForMatchingCommand() throws Exception {
        CliValidationRequest request = new CliValidationRequest(
                "status-basics",
                List.of(),
                new SubmittedAnswer("command_text", "git status --short"),
                new ScenarioValidationSpec(
                        "test:status-basics:command_text",
                        "status-basics",
                        "command_text",
                        "exact_command_match",
                        5000,
                        Map.of(),
                        List.of(
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git status",
                                        "git status",
                                        "correct",
                                        "expected-command",
                                        "ok"
                                ),
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git status --short",
                                        "git status --short",
                                        "correct",
                                        "expected-command",
                                        "ok"
                                )
                        )
                )
        );
        Path requestFile = Files.createTempFile("git-cli-test-", ".json");
        Files.writeString(requestFile, OBJECT_MAPPER.writeValueAsString(request));

        PrintStream originalOut = System.out;
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        try {
            System.setOut(new PrintStream(stdout));

            GitValidationCliMain.main(new String[]{"--request-file", requestFile.toString()});
        } finally {
            System.setOut(originalOut);
            Files.deleteIfExists(requestFile);
        }

        CliValidationResponse response = OBJECT_MAPPER.readValue(stdout.toString(), CliValidationResponse.class);
        assertThat(response.status()).isEqualTo("evaluated");
        assertThat(response.correctness()).isEqualTo("correct");
        assertThat(response.code()).isEqualTo("expected-command");
        assertThat(response.observations()).extracting(CliValidationObservation::message)
                .containsExactly("git status --short");
    }

    @Test
    void writesJsonOutcomeForRealGitCommandProbe() throws Exception {
        CliValidationRequest request = new CliValidationRequest(
                "branch-safety",
                List.of(),
                new SubmittedAnswer("command_text", "git branch --show-current"),
                new ScenarioValidationSpec(
                        "test:branch-safety:command_text",
                        "branch-safety",
                        "command_text",
                        "git_command_probe",
                        5000,
                        Map.of(
                                "expectedExitCode", 0,
                                "expectedWorkspaceState", Map.of(
                                        "currentBranch", "release/hotfix-7",
                                        "workingTreeClean", false
                                ),
                                "requiredPriorCommandsByCommand", Map.of(
                                        "git status -sb", List.of("git branch --show-current"),
                                        "git status --short -b", List.of("git branch --show-current")
                                ),
                                "workspaceTemplate", Map.of(
                                        "initialBranch", "main",
                                        "currentBranch", "release/hotfix-7",
                                        "branches", List.of("release/hotfix-7", "feature/menu-refresh", "main"),
                                        "committedFiles", List.of(
                                                Map.of("path", "src/ui/header.css", "content", ".header { padding: 8px; }\n"),
                                                Map.of("path", "docs/release-checklist.md", "content", "- verify deploy\n")
                                        ),
                                        "modifiedFiles", List.of(
                                                Map.of("path", "src/ui/header.css", "content", ".header { padding: 12px; }\n"),
                                                Map.of("path", "docs/release-checklist.md", "content", "- verify deploy\n- smoke test\n")
                                        ),
                                        "untrackedFiles", List.of()
                                )
                        ),
                        List.of(new ScenarioValidationRule(
                                "exact_normalized_command",
                                "git branch --show-current",
                                "git branch --show-current",
                                "partial",
                                "branch-context-confirmed",
                                "ok"
                        ),
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git status -sb",
                                        "git status -sb",
                                        "correct",
                                        "expected-command",
                                        "ok"
                                )
                        )
                )
        );
        Path requestFile = Files.createTempFile("git-cli-probe-test-", ".json");
        Files.writeString(requestFile, OBJECT_MAPPER.writeValueAsString(request));

        PrintStream originalOut = System.out;
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        try {
            System.setOut(new PrintStream(stdout));

            GitValidationCliMain.main(new String[]{"--request-file", requestFile.toString()});
        } finally {
            System.setOut(originalOut);
            Files.deleteIfExists(requestFile);
        }

        CliValidationResponse response = OBJECT_MAPPER.readValue(stdout.toString(), CliValidationResponse.class);
        assertThat(response.status()).isEqualTo("evaluated");
        assertThat(response.correctness()).isEqualTo("partial");
        assertThat(response.code()).isEqualTo("branch-context-confirmed");
        assertThat(response.observations()).extracting(CliValidationObservation::code)
                .contains("current-branch", "working-tree-clean");
    }

    @Test
    void writesJsonOutcomeForBranchSafetyAfterRequiredHistory() throws Exception {
        CliValidationRequest request = new CliValidationRequest(
                "branch-safety",
                List.of(new SubmittedAnswer("command_text", "git branch --show-current")),
                new SubmittedAnswer("command_text", "git status -sb"),
                new ScenarioValidationSpec(
                        "test:branch-safety:command_text",
                        "branch-safety",
                        "command_text",
                        "git_command_probe",
                        5000,
                        Map.of(
                                "expectedExitCode", 0,
                                "expectedWorkspaceState", Map.of(
                                        "currentBranch", "release/hotfix-7",
                                        "workingTreeClean", false
                                ),
                                "requiredPriorCommandsByCommand", Map.of(
                                        "git status -sb", List.of("git branch --show-current")
                                ),
                                "workspaceTemplate", Map.of(
                                        "initialBranch", "main",
                                        "currentBranch", "release/hotfix-7",
                                        "branches", List.of("release/hotfix-7", "feature/menu-refresh", "main"),
                                        "committedFiles", List.of(
                                                Map.of("path", "src/ui/header.css", "content", ".header { padding: 8px; }\n"),
                                                Map.of("path", "docs/release-checklist.md", "content", "- verify deploy\n")
                                        ),
                                        "modifiedFiles", List.of(
                                                Map.of("path", "src/ui/header.css", "content", ".header { padding: 12px; }\n"),
                                                Map.of("path", "docs/release-checklist.md", "content", "- verify deploy\n- smoke test\n")
                                        ),
                                        "untrackedFiles", List.of()
                                )
                        ),
                        List.of(
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git branch --show-current",
                                        "git branch --show-current",
                                        "partial",
                                        "branch-context-confirmed",
                                        "ok"
                                ),
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git status -sb",
                                        "git status -sb",
                                        "correct",
                                        "expected-command",
                                        "ok"
                                )
                        )
                )
        );
        Path requestFile = Files.createTempFile("git-cli-branch-history-test-", ".json");
        Files.writeString(requestFile, OBJECT_MAPPER.writeValueAsString(request));

        PrintStream originalOut = System.out;
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        try {
            System.setOut(new PrintStream(stdout));

            GitValidationCliMain.main(new String[]{"--request-file", requestFile.toString()});
        } finally {
            System.setOut(originalOut);
            Files.deleteIfExists(requestFile);
        }

        CliValidationResponse response = OBJECT_MAPPER.readValue(stdout.toString(), CliValidationResponse.class);
        assertThat(response.status()).isEqualTo("evaluated");
        assertThat(response.correctness()).isEqualTo("correct");
        assertThat(response.code()).isEqualTo("expected-command");
    }

    @Test
    void writesStdoutForUnexpectedCommandInGitCommandProbe() throws Exception {
        CliValidationRequest request = new CliValidationRequest(
                "history-cleanup-preview",
                List.of(),
                new SubmittedAnswer("command_text", "git status"),
                new ScenarioValidationSpec(
                        "test:history-cleanup-preview:command_text",
                        "history-cleanup-preview",
                        "command_text",
                        "git_command_probe",
                        5000,
                        Map.of(
                                "expectedExitCode", 0,
                                "expectedWorkspaceState", Map.of(
                                        "currentBranch", "feature/history-cleanup",
                                        "workingTreeClean", false
                                ),
                                "workspaceTemplate", Map.of(
                                        "initialBranch", "main",
                                        "currentBranch", "feature/history-cleanup",
                                        "branches", List.of("feature/history-cleanup", "main"),
                                        "committedFiles", List.of(
                                                Map.of("path", "frontend/src/styles.css", "content", ".badge { padding: 4px; }\n"),
                                                Map.of("path", "frontend/src/workspace-shell/view.js", "content", "export const badge = 'shell';\n")
                                        ),
                                        "modifiedFiles", List.of(
                                                Map.of("path", "frontend/src/styles.css", "content", ".badge { padding: 6px; }\n"),
                                                Map.of("path", "frontend/src/workspace-shell/view.js", "content", "export const badge = 'shell-preview';\n")
                                        ),
                                        "untrackedFiles", List.of()
                                )
                        ),
                        List.of(
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git log --oneline --decorate",
                                        "git log --oneline --decorate",
                                        "partial",
                                        "history-preview-opened",
                                        "ok"
                                ),
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git log --oneline --graph --decorate",
                                        "git log --oneline --graph --decorate",
                                        "correct",
                                        "expected-command",
                                        "ok"
                                )
                        )
                )
        );
        Path requestFile = Files.createTempFile("git-cli-unexpected-command-probe-test-", ".json");
        Files.writeString(requestFile, OBJECT_MAPPER.writeValueAsString(request));

        PrintStream originalOut = System.out;
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        try {
            System.setOut(new PrintStream(stdout));

            GitValidationCliMain.main(new String[]{"--request-file", requestFile.toString()});
        } finally {
            System.setOut(originalOut);
            Files.deleteIfExists(requestFile);
        }

        CliValidationResponse response = OBJECT_MAPPER.readValue(stdout.toString(), CliValidationResponse.class);
        assertThat(response.status()).isEqualTo("evaluated");
        assertThat(response.correctness()).isEqualTo("incorrect");
        assertThat(response.code()).isEqualTo("unexpected-command");
        assertThat(response.observations()).extracting(CliValidationObservation::code)
                .contains("stdout", "stderr");
        assertThat(response.observations()).extracting(CliValidationObservation::message)
                .anyMatch(message -> message.contains("On branch feature/history-cleanup"));
    }

    @Test
    void writesJsonOutcomeForRealGitRepoStateProbe() throws Exception {
        CliValidationRequest request = new CliValidationRequest(
                "remote-sync-preview",
                List.of(),
                new SubmittedAnswer("command_text", "git fetch origin"),
                new ScenarioValidationSpec(
                        "test:remote-sync-preview:command_text",
                        "remote-sync-preview",
                        "command_text",
                        "git_repo_state_probe",
                        5000,
                        Map.of(
                                "expectedExitCode", 0,
                                "workspaceTemplate", Map.of(
                                        "initialBranch", "main",
                                        "remoteName", "origin",
                                        "localAheadCommitMessage", "local notes WIP",
                                        "remoteAheadCommitMessage", "remote hotfix ready",
                                        "baseFiles", List.of(
                                                Map.of("path", "README.md", "content", "# Git Trainer\n"),
                                                Map.of("path", "docs/sync-playbook.md", "content", "- inspect divergence\n")
                                        ),
                                        "localAheadFiles", List.of(
                                                Map.of("path", "docs/local-notes.md", "content", "- pending local integration\n")
                                        ),
                                        "remoteAheadFiles", List.of(
                                                Map.of("path", "release/remote-hotfix.md", "content", "- hotfix available upstream\n")
                                        )
                                ),
                                "expectedState", Map.of(
                                        "currentBranch", "main",
                                        "localHeadCommitMessage", "local notes WIP",
                                        "fetchHeadCommitMessage", "remote hotfix ready",
                                        "remoteTrackingRefs", List.of(
                                                Map.of("ref", "refs/remotes/origin/main", "commitMessage", "remote hotfix ready")
                                        )
                                )
                        ),
                        List.of(
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git fetch",
                                        "git fetch",
                                        "correct",
                                        "expected-command",
                                        "ok"
                                ),
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git fetch origin",
                                        "git fetch origin",
                                        "correct",
                                        "expected-command",
                                        "ok"
                                ),
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git fetch --all --prune",
                                        "git fetch --all --prune",
                                        "correct",
                                        "expected-command",
                                        "ok"
                                )
                        )
                )
        );
        Path requestFile = Files.createTempFile("git-cli-state-probe-test-", ".json");
        Files.writeString(requestFile, OBJECT_MAPPER.writeValueAsString(request));

        PrintStream originalOut = System.out;
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        try {
            System.setOut(new PrintStream(stdout));

            GitValidationCliMain.main(new String[]{"--request-file", requestFile.toString()});
        } finally {
            System.setOut(originalOut);
            Files.deleteIfExists(requestFile);
        }

        CliValidationResponse response = OBJECT_MAPPER.readValue(stdout.toString(), CliValidationResponse.class);
        assertThat(response.status()).isEqualTo("evaluated");
        assertThat(response.correctness()).isEqualTo("correct");
        assertThat(response.code()).isEqualTo("expected-command");
        assertThat(response.observations()).extracting(CliValidationObservation::code)
                .contains("current-branch", "local-head-commit", "fetch-head-commit", "remote-tracking-ref");
    }

    @Test
    void writesStdoutForUnexpectedCommandInGitRepoStateProbe() throws Exception {
        CliValidationRequest request = new CliValidationRequest(
                "remote-sync-preview",
                List.of(),
                new SubmittedAnswer("command_text", "git status -sb"),
                new ScenarioValidationSpec(
                        "test:remote-sync-preview:command_text",
                        "remote-sync-preview",
                        "command_text",
                        "git_repo_state_probe",
                        5000,
                        Map.of(
                                "expectedExitCode", 0,
                                "workspaceTemplate", Map.of(
                                        "initialBranch", "main",
                                        "remoteName", "origin",
                                        "localAheadCommitMessage", "local notes WIP",
                                        "remoteAheadCommitMessage", "remote hotfix ready",
                                        "baseFiles", List.of(
                                                Map.of("path", "README.md", "content", "# Git Trainer\n"),
                                                Map.of("path", "docs/sync-playbook.md", "content", "- inspect divergence\n")
                                        ),
                                        "localAheadFiles", List.of(
                                                Map.of("path", "docs/local-notes.md", "content", "- pending local integration\n")
                                        ),
                                        "remoteAheadFiles", List.of(
                                                Map.of("path", "release/remote-hotfix.md", "content", "- hotfix available upstream\n")
                                        )
                                ),
                                "expectedState", Map.of(
                                        "currentBranch", "main",
                                        "localHeadCommitMessage", "local notes WIP",
                                        "fetchHeadCommitMessage", "remote hotfix ready",
                                        "remoteTrackingRefs", List.of(
                                                Map.of("ref", "refs/remotes/origin/main", "commitMessage", "remote hotfix ready")
                                        )
                                )
                        ),
                        List.of(
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git fetch",
                                        "git fetch",
                                        "correct",
                                        "expected-command",
                                        "ok"
                                )
                        )
                )
        );
        Path requestFile = Files.createTempFile("git-cli-unexpected-state-probe-test-", ".json");
        Files.writeString(requestFile, OBJECT_MAPPER.writeValueAsString(request));

        PrintStream originalOut = System.out;
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        try {
            System.setOut(new PrintStream(stdout));

            GitValidationCliMain.main(new String[]{"--request-file", requestFile.toString()});
        } finally {
            System.setOut(originalOut);
            Files.deleteIfExists(requestFile);
        }

        CliValidationResponse response = OBJECT_MAPPER.readValue(stdout.toString(), CliValidationResponse.class);
        assertThat(response.status()).isEqualTo("evaluated");
        assertThat(response.correctness()).isEqualTo("incorrect");
        assertThat(response.code()).isEqualTo("unexpected-command");
        assertThat(response.observations()).extracting(CliValidationObservation::code)
                .contains("stdout", "stderr");
        assertThat(response.observations()).extracting(CliValidationObservation::message)
                .anyMatch(message -> message.contains("## main"));
    }

    @Test
    void writesJsonOutcomeForStateProbeAfterReplayOfPriorCommands() throws Exception {
        CliValidationRequest request = new CliValidationRequest(
                "remote-sync-apply",
                List.of(new SubmittedAnswer("command_text", "git fetch origin")),
                new SubmittedAnswer("command_text", "git reset --hard origin/main"),
                new ScenarioValidationSpec(
                        "test:remote-sync-apply:command_text",
                        "remote-sync-apply",
                        "command_text",
                        "git_repo_state_probe",
                        5000,
                        Map.of(
                                "expectedExitCode", 0,
                                "workspaceTemplate", Map.of(
                                        "initialBranch", "main",
                                        "remoteName", "origin",
                                        "localAheadCommitMessage", "local notes WIP",
                                        "remoteAheadCommitMessage", "remote hotfix ready",
                                        "baseFiles", List.of(
                                                Map.of("path", "README.md", "content", "# Git Trainer\n")
                                        ),
                                        "localAheadFiles", List.of(
                                                Map.of("path", "docs/local-notes.md", "content", "- pending local integration\n")
                                        ),
                                        "remoteAheadFiles", List.of(
                                                Map.of("path", "release/remote-hotfix.md", "content", "- hotfix available upstream\n")
                                        )
                                ),
                                "expectedState", Map.of(
                                        "currentBranch", "main",
                                        "localHeadCommitMessage", "remote hotfix ready",
                                        "fetchHeadCommitMessage", "remote hotfix ready",
                                        "remoteTrackingRefs", List.of(
                                                Map.of("ref", "refs/remotes/origin/main", "commitMessage", "remote hotfix ready")
                                        )
                                )
                        ),
                        List.of(
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git fetch origin",
                                        "git fetch origin",
                                        "correct",
                                        "expected-command",
                                        "ok"
                                ),
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git reset --hard origin/main",
                                        "git reset --hard origin/main",
                                        "correct",
                                        "expected-command",
                                        "ok"
                                )
                        )
                )
        );
        Path requestFile = Files.createTempFile("git-cli-state-history-test-", ".json");
        Files.writeString(requestFile, OBJECT_MAPPER.writeValueAsString(request));

        PrintStream originalOut = System.out;
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        try {
            System.setOut(new PrintStream(stdout));

            GitValidationCliMain.main(new String[]{"--request-file", requestFile.toString()});
        } finally {
            System.setOut(originalOut);
            Files.deleteIfExists(requestFile);
        }

        CliValidationResponse response = OBJECT_MAPPER.readValue(stdout.toString(), CliValidationResponse.class);
        assertThat(response.status()).isEqualTo("evaluated");
        assertThat(response.correctness()).isEqualTo("correct");
        assertThat(response.code()).isEqualTo("expected-command");
        assertThat(response.observations()).extracting(CliValidationObservation::message)
                .contains("remote hotfix ready");
    }

    @Test
    void writesJsonOutcomeForWorkspaceStateAwareCommandProbe() throws Exception {
        CliValidationRequest request = new CliValidationRequest(
                "stash-checkpoint-draft",
                List.of(new SubmittedAnswer("command_text", "git status -sb")),
                new SubmittedAnswer("command_text", "git stash push -u"),
                new ScenarioValidationSpec(
                        "test:stash-checkpoint-draft:command_text",
                        "stash-checkpoint-draft",
                        "command_text",
                        "git_command_probe",
                        5000,
                        Map.of(
                                "expectedExitCode", 0,
                                "expectedWorkspaceState", Map.of(
                                        "currentBranch", "feature/test-stash-panel",
                                        "workingTreeClean", true,
                                        "stashEntryCount", 1
                                ),
                                "workspaceTemplate", Map.of(
                                        "initialBranch", "main",
                                        "currentBranch", "feature/test-stash-panel",
                                        "branches", List.of("feature/test-stash-panel", "main"),
                                        "committedFiles", List.of(
                                                Map.of("path", "frontend/src/demo-panel.js", "content", "export const panel = 'draft';\n")
                                        ),
                                        "modifiedFiles", List.of(
                                                Map.of("path", "frontend/src/demo-panel.js", "content", "export const panel = 'draft-staged';\n")
                                        ),
                                        "untrackedFiles", List.of(
                                                Map.of("path", "notes/ui-placeholder.txt", "content", "temporary ui notes\n")
                                        )
                                )
                        ),
                        List.of(
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git status -sb",
                                        "git status -sb",
                                        "partial",
                                        "workspace-inspected",
                                        "inspect"
                                ),
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git stash push -u",
                                        "git stash push -u",
                                        "correct",
                                        "expected-command",
                                        "stash"
                                )
                        )
                )
        );
        Path requestFile = Files.createTempFile("git-cli-command-state-test-", ".json");
        Files.writeString(requestFile, OBJECT_MAPPER.writeValueAsString(request));

        PrintStream originalOut = System.out;
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        try {
            System.setOut(new PrintStream(stdout));

            GitValidationCliMain.main(new String[]{"--request-file", requestFile.toString()});
        } finally {
            System.setOut(originalOut);
            Files.deleteIfExists(requestFile);
        }

        CliValidationResponse response = OBJECT_MAPPER.readValue(stdout.toString(), CliValidationResponse.class);
        assertThat(response.status()).isEqualTo("evaluated");
        assertThat(response.correctness()).isEqualTo("correct");
        assertThat(response.code()).isEqualTo("expected-command");
        assertThat(response.observations()).extracting(CliValidationObservation::code)
                .contains("current-branch", "working-tree-clean", "stash-entry-count");
    }

    @Test
    void writesJsonOutcomeForTagAwareCommandProbe() throws Exception {
        CliValidationRequest request = new CliValidationRequest(
                "tag-checkpoint-preview",
                List.of(),
                new SubmittedAnswer("command_text", "git show-ref --tags"),
                new ScenarioValidationSpec(
                        "test:tag-checkpoint-preview:command_text",
                        "tag-checkpoint-preview",
                        "command_text",
                        "git_command_probe",
                        5000,
                        Map.of(
                                "expectedExitCode", 0,
                                "expectedWorkspaceState", Map.of(
                                        "currentBranch", "main",
                                        "workingTreeClean", true,
                                        "tagCount", 2
                                ),
                                "workspaceTemplate", Map.of(
                                        "initialBranch", "main",
                                        "currentBranch", "main",
                                        "branches", List.of(),
                                        "committedFiles", List.of(
                                                Map.of("path", "docs/release-tags.md", "content", "- release/demo-v1\n"),
                                                Map.of("path", "frontend/src/tag-chip.js", "content", "export const checkpoint = 'demo';\n")
                                        ),
                                        "modifiedFiles", List.of(),
                                        "untrackedFiles", List.of(),
                                        "tags", List.of("release/demo-v1", "checkpoint/ui-shell")
                                )
                        ),
                        List.of(
                                new ScenarioValidationRule(
                                        "exact_normalized_command",
                                        "git show-ref --tags",
                                        "git show-ref --tags",
                                        "correct",
                                        "expected-command",
                                        "tags"
                                )
                        )
                )
        );
        Path requestFile = Files.createTempFile("git-cli-tag-state-test-", ".json");
        Files.writeString(requestFile, OBJECT_MAPPER.writeValueAsString(request));

        PrintStream originalOut = System.out;
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        try {
            System.setOut(new PrintStream(stdout));

            GitValidationCliMain.main(new String[]{"--request-file", requestFile.toString()});
        } finally {
            System.setOut(originalOut);
            Files.deleteIfExists(requestFile);
        }

        CliValidationResponse response = OBJECT_MAPPER.readValue(stdout.toString(), CliValidationResponse.class);
        assertThat(response.status()).isEqualTo("evaluated");
        assertThat(response.correctness()).isEqualTo("correct");
        assertThat(response.code()).isEqualTo("expected-command");
        assertThat(response.observations()).extracting(CliValidationObservation::code)
                .contains("tag-count");
    }
}
