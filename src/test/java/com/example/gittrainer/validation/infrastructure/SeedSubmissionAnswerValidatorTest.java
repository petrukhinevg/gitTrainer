package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.session.application.SessionWorkspaceManager;
import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.ScenarioValidationRule;
import com.example.gittrainer.validation.application.ScenarioValidationSpec;
import com.example.gittrainer.validation.application.ScenarioValidationSpecSource;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SeedSubmissionAnswerValidatorTest {

    private final SeedSubmissionAnswerValidator validator =
            new SeedSubmissionAnswerValidator(new SeedScenarioValidationSpecSource(), new NoOpSessionWorkspaceManager());

    @Test
    void marksFullStatusCommandAsPartial() {
        SubmissionOutcome outcome = validator.validate(
                "status-basics",
                new SubmittedAnswer("command_text", "git status")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("partial", outcome.correctness());
        assertEquals("working-tree-inspected", outcome.code());
    }

    @Test
    void marksAcceptedCommandVariantAsCorrect() {
        SubmissionOutcome outcome = validator.validate(
                "status-basics",
                new SubmittedAnswer("command_text", "git status --short")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("correct", outcome.correctness());
        assertEquals("expected-command", outcome.code());
    }

    @Test
    void marksHistoryPreviewCommandAsCorrect() {
        SubmissionOutcome outcome = validator.validate(
                "history-cleanup-preview",
                new SubmittedAnswer("command_text", "git log --oneline --graph --decorate")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("correct", outcome.correctness());
        assertEquals("expected-command", outcome.code());
    }

    @Test
    void marksHistoryListCommandAsPartial() {
        SubmissionOutcome outcome = validator.validate(
                "history-cleanup-preview",
                new SubmittedAnswer("command_text", "git log --oneline --decorate")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("partial", outcome.correctness());
        assertEquals("history-preview-opened", outcome.code());
    }

    @Test
    void marksFetchCommandAsCorrectForRemoteSyncPreview() {
        SubmissionOutcome outcome = validator.validate(
                "remote-sync-preview",
                new SubmittedAnswer("command_text", "git fetch origin")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("correct", outcome.correctness());
        assertEquals("expected-command", outcome.code());
    }

    @Test
    void marksBranchReadingCommandAsPartialForBranchSafety() {
        SubmissionOutcome outcome = validator.validate(
                "branch-safety",
                new SubmittedAnswer("command_text", "git branch --show-current")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("partial", outcome.correctness());
        assertEquals("branch-context-confirmed", outcome.code());
    }

    @Test
    void marksBranchStatusAsCorrectAfterBranchReadingForBranchSafety(@TempDir Path tempDir) {
        ScenarioValidationSpecSource specSource = new SeedScenarioValidationSpecSource();
        SessionWorkspaceManager workspaceManager =
                new com.example.gittrainer.session.infrastructure.FilesystemSessionWorkspaceManager(
                        tempDir.toString(),
                        specSource
                );
        SeedSubmissionAnswerValidator branchValidator =
                new SeedSubmissionAnswerValidator(specSource, workspaceManager);
        String sessionId = "branch-session";
        workspaceManager.initializeWorkspace(sessionId, "branch-safety");

        SubmissionOutcome outcome = branchValidator.validate(
                sessionId,
                "branch-safety",
                List.of(new SubmittedAnswer("command_text", "git branch --show-current")),
                new SubmittedAnswer("command_text", "git status -sb")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("correct", outcome.correctness());
        assertEquals("expected-command", outcome.code());
    }

    @Test
    void keepsHistoryRewriteCommandIncorrectInPreviewScenario() {
        SubmissionOutcome outcome = validator.validate(
                "history-cleanup-preview",
                new SubmittedAnswer("command_text", "git rebase -i HEAD~3")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("incorrect", outcome.correctness());
        assertEquals("unexpected-command", outcome.code());
    }

    @Test
    void keepsPullIncorrectForRemoteSyncPreview() {
        SubmissionOutcome outcome = validator.validate(
                "remote-sync-preview",
                new SubmittedAnswer("command_text", "git pull")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("incorrect", outcome.correctness());
        assertEquals("unexpected-command", outcome.code());
    }

    @Test
    void keepsCheckoutIncorrectForBranchSafety() {
        SubmissionOutcome outcome = validator.validate(
                "branch-safety",
                new SubmittedAnswer("command_text", "git checkout feature/menu-refresh")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("incorrect", outcome.correctness());
        assertEquals("unexpected-command", outcome.code());
    }

    @Test
    void validatesTagPreviewUsingWorkspaceTags() {
        SubmissionOutcome outcome = validator.validate(
                "tag-checkpoint-preview",
                new SubmittedAnswer("command_text", "git show-ref --tags")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("correct", outcome.correctness());
        assertEquals("expected-command", outcome.code());
    }

    @Test
    void marksUnexpectedCommandAsIncorrect() {
        SubmissionOutcome outcome = validator.validate(
                "status-basics",
                new SubmittedAnswer("command_text", "git checkout main")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("incorrect", outcome.correctness());
        assertEquals("unexpected-command", outcome.code());
    }

    @Test
    void marksUnsupportedAnswerTypeAsUnsupported() {
        SubmissionOutcome outcome = validator.validate(
                "status-basics",
                new SubmittedAnswer("file_patch", "diff --git a")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("unsupported", outcome.correctness());
        assertEquals("unsupported-answer-type", outcome.code());
    }

    @Test
    void marksUnknownScenarioRuleAsMissing() {
        SubmissionOutcome outcome = validator.validate(
                "unknown-scenario",
                new SubmittedAnswer("command_text", "git status")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("incorrect", outcome.correctness());
        assertEquals("validation-rule-missing", outcome.code());
    }

    @Test
    void marksScenarioCorrectWhenAllowedCommandHistoryReachesExpectedRepoState() {
        SeedSubmissionAnswerValidator historyAwareValidator = new SeedSubmissionAnswerValidator(
                historySpecSource(),
                new NoOpSessionWorkspaceManager()
        );

        SubmissionOutcome outcome = historyAwareValidator.validate(
                "remote-sync-apply",
                List.of(new SubmittedAnswer("command_text", "git fetch origin")),
                new SubmittedAnswer("command_text", "git reset --hard origin/main")
        ).outcome();

        assertEquals("evaluated", outcome.status());
        assertEquals("correct", outcome.correctness());
        assertEquals("expected-command", outcome.code());
    }

    @Test
    void keepsWorkspaceSeparatePerSessionAndMarksIntermediateStateAsPartial(@TempDir Path tempDir) {
        ScenarioValidationSpecSource specSource = historySpecSource();
        SessionWorkspaceManager workspaceManager =
                new com.example.gittrainer.session.infrastructure.FilesystemSessionWorkspaceManager(
                        tempDir.toString(),
                        specSource
                );
        SeedSubmissionAnswerValidator historyAwareValidator =
                new SeedSubmissionAnswerValidator(specSource, workspaceManager);
        String sessionId = "session-1";
        workspaceManager.initializeWorkspace(sessionId, "remote-sync-apply");

        SubmissionOutcome firstOutcome = historyAwareValidator.validate(
                sessionId,
                "remote-sync-apply",
                List.of(),
                new SubmittedAnswer("command_text", "git fetch origin")
        ).outcome();
        SubmissionOutcome secondOutcome = historyAwareValidator.validate(
                sessionId,
                "remote-sync-apply",
                List.of(new SubmittedAnswer("command_text", "git fetch origin")),
                new SubmittedAnswer("command_text", "git reset --hard origin/main")
        ).outcome();

        assertEquals("partial", firstOutcome.correctness());
        assertEquals("git-repo-state-incomplete", firstOutcome.code());
        assertEquals("correct", secondOutcome.correctness());
        assertEquals("expected-command", secondOutcome.code());
    }

    @Test
    void marksRealStashScenarioAsPartialBeforeCheckpointAndCorrectAfterCheckpoint(@TempDir Path tempDir) {
        ScenarioValidationSpecSource specSource = new SeedScenarioValidationSpecSource();
        SessionWorkspaceManager workspaceManager =
                new com.example.gittrainer.session.infrastructure.FilesystemSessionWorkspaceManager(
                        tempDir.toString(),
                        specSource
                );
        SeedSubmissionAnswerValidator stashValidator =
                new SeedSubmissionAnswerValidator(specSource, workspaceManager);
        String sessionId = "stash-session";
        workspaceManager.initializeWorkspace(sessionId, "stash-checkpoint-draft");

        SubmissionOutcome firstOutcome = stashValidator.validate(
                sessionId,
                "stash-checkpoint-draft",
                List.of(),
                new SubmittedAnswer("command_text", "git status -sb")
        ).outcome();
        SubmissionOutcome secondOutcome = stashValidator.validate(
                sessionId,
                "stash-checkpoint-draft",
                List.of(new SubmittedAnswer("command_text", "git status -sb")),
                new SubmittedAnswer("command_text", "git stash push -u")
        ).outcome();

        assertEquals("partial", firstOutcome.correctness());
        assertEquals("workspace-inspected", firstOutcome.code());
        assertEquals("correct", secondOutcome.correctness());
        assertEquals("expected-command", secondOutcome.code());
    }

    private ScenarioValidationSpecSource historySpecSource() {
        return (scenarioSlug, answerType) -> {
            if (!"remote-sync-apply".equals(scenarioSlug) || !"command_text".equals(answerType)) {
                return Optional.empty();
            }
            return Optional.of(new ScenarioValidationSpec(
                    "default:remote-sync-apply:command_text",
                    scenarioSlug,
                    answerType,
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
            ));
        };
    }

    private static final class NoOpSessionWorkspaceManager implements SessionWorkspaceManager {

        @Override
        public void initializeWorkspace(String sessionId, String scenarioSlug) {
        }

        @Override
        public Optional<Path> resolveWorkspacePath(String sessionId) {
            return Optional.empty();
        }
    }
}
