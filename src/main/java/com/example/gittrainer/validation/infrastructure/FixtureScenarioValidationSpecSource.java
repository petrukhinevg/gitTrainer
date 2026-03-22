package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.validation.application.CommandTextNormalizer;
import com.example.gittrainer.validation.application.ScenarioValidationRule;
import com.example.gittrainer.validation.application.ScenarioValidationSpec;
import com.example.gittrainer.validation.application.ScenarioValidationSpecSource;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@Profile("test | local-memory")
public class FixtureScenarioValidationSpecSource implements ScenarioValidationSpecSource {

    private static final long DEFAULT_VALIDATOR_TIMEOUT_MS = 5_000L;
    private static final String BRANCH_SAFETY = "branch-safety";
    private static final Map<String, List<String>> RULES = FixtureSubmissionRuleLoader.loadRules();

    @Override
    public Optional<ScenarioValidationSpec> findSpec(String scenarioSlug, String answerType) {
        List<String> commands = RULES.get(scenarioSlug);
        if (commands == null) {
            return Optional.empty();
        }
        if (BRANCH_SAFETY.equals(scenarioSlug)) {
            return Optional.of(branchSafetySpec(answerType));
        }

        List<ScenarioValidationRule> rules = commands.stream()
                .map(command -> new ScenarioValidationRule(
                        "exact_normalized_command",
                        command,
                        CommandTextNormalizer.normalize(command),
                        "correct",
                        "expected-command",
                        "Отправленная команда совпадает с ожидаемым безопасным следующим шагом для этого сценария."
                ))
                .toList();

        return Optional.of(new ScenarioValidationSpec(
                "fixture:" + scenarioSlug + ":" + answerType,
                scenarioSlug,
                answerType,
                "exact_command_match",
                DEFAULT_VALIDATOR_TIMEOUT_MS,
                Map.of(),
                rules
        ));
    }

    private ScenarioValidationSpec branchSafetySpec(String answerType) {
        return new ScenarioValidationSpec(
                "fixture:branch-safety:" + answerType,
                BRANCH_SAFETY,
                answerType,
                "git_command_probe",
                DEFAULT_VALIDATOR_TIMEOUT_MS,
                Map.of(
                        "expectedExitCode", 0,
                        "expectedStdout", "release/hotfix-7",
                        "workspaceTemplate", Map.of(
                                "initialBranch", "main",
                                "currentBranch", "release/hotfix-7",
                                "branches", List.of("release/hotfix-7", "feature/menu-refresh", "main"),
                                "committedFiles", List.of(
                                        Map.of(
                                                "path", "src/ui/header.css",
                                                "content", ".header { padding: 8px; }\n"
                                        ),
                                        Map.of(
                                                "path", "docs/release-checklist.md",
                                                "content", "- verify deploy\n"
                                        )
                                ),
                                "modifiedFiles", List.of(
                                        Map.of(
                                                "path", "src/ui/header.css",
                                                "content", ".header { padding: 12px; }\n"
                                        ),
                                        Map.of(
                                                "path", "docs/release-checklist.md",
                                                "content", "- verify deploy\n- smoke test\n"
                                        )
                                ),
                                "untrackedFiles", List.of()
                        )
                ),
                List.of(new ScenarioValidationRule(
                        "exact_normalized_command",
                        "git branch --show-current",
                        "git branch --show-current",
                        "correct",
                        "expected-command",
                        "Отправленная команда совпадает с ожидаемым безопасным следующим шагом для этого сценария."
                ))
        );
    }
}
