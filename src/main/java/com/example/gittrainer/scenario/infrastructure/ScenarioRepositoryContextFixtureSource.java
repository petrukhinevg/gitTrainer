package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ScenarioRepositoryContextFixtureSource {

    private static final Map<String, ScenarioWorkspaceDetail.ScenarioRepositoryContext> FIXTURES = Map.of(
            "status-basics", new ScenarioWorkspaceDetail.ScenarioRepositoryContext(
                    "authored-fixture",
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("main", true),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("docs/review-notes", false)
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("a1c9e31", "docs: add review notes draft"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("f72ab44", "app: keep workspace shell stable")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("README.md", "modified"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("notes/status-checklist.md", "untracked"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("src/main.js", "modified")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Working tree cue", "Two tracked files changed and one checklist file is still untracked."),
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Decision cue", "This scenario rewards an inspection command before any staging or cleanup.")
                    )
            ),
            "branch-safety", new ScenarioWorkspaceDetail.ScenarioRepositoryContext(
                    "authored-fixture",
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("release/hotfix-7", true),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("feature/menu-refresh", false),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("main", false)
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("b74e2d0", "hotfix: restore header spacing"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("197a0f4", "release: tag rollout checklist")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("src/ui/header.css", "modified"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("docs/release-checklist.md", "modified")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Branch purpose", "The current branch is a hotfix branch with release-oriented changes already in progress."),
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Task tension", "The learner must decide whether the requested work belongs here or on the feature branch.")
                    )
            ),
            "history-cleanup-preview", new ScenarioWorkspaceDetail.ScenarioRepositoryContext(
                    "authored-fixture",
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("feature/history-cleanup", true),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("main", false)
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("c102d6b", "fixup! ui: rename shell badge"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("91fe2ad", "ui: rename shell badge"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("43bc8c1", "wip: tweak spacing again")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("frontend/src/styles.css", "modified"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("frontend/src/workspace-shell/view.js", "modified")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("History cue", "Recent commits include a fixup commit and an extra WIP change that suggest later cleanup."),
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Safety cue", "The learner is still planning and should not rewrite history yet.")
                    )
            ),
            "remote-sync-preview", new ScenarioWorkspaceDetail.ScenarioRepositoryContext(
                    "authored-fixture",
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("main", true),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("origin/main", false)
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("87d20aa", "docs: clarify sync checklist"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("3fd81e5", "feat: prepare remote status banner")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("docs/sync-playbook.md", "clean"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("frontend/src/banner.js", "clean")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Remote cue", "Local main is one commit ahead while origin/main has unseen remote changes."),
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Decision cue", "The learner should decide whether to fetch first before choosing any integrating command.")
                    )
            )
    );

    public ScenarioWorkspaceDetail.ScenarioRepositoryContext fixtureFor(String scenarioSlug) {
        return FIXTURES.getOrDefault(
                scenarioSlug,
                new ScenarioWorkspaceDetail.ScenarioRepositoryContext(
                        "authored-fixture",
                        List.of(),
                        List.of(),
                        List.of(),
                        List.of()
                )
        );
    }
}
