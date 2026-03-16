package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.SubmissionAnswerValidator;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

@Component
public class FixtureSubmissionAnswerValidator implements SubmissionAnswerValidator {

    private static final Map<String, Set<String>> SUPPORTED_COMMANDS_BY_SCENARIO = Map.of(
            "status-basics", Set.of(
                    "git status",
                    "git status --short",
                    "git status -sb"
            ),
            "branch-safety", Set.of(
                    "git branch --show-current",
                    "git status -sb",
                    "git status --short -b"
            ),
            "history-cleanup-preview", Set.of(
                    "git log --oneline --decorate",
                    "git log --oneline --graph --decorate",
                    "git log --graph --oneline --decorate"
            ),
            "remote-sync-preview", Set.of(
                    "git fetch",
                    "git fetch origin",
                    "git fetch --all --prune"
            )
    );

    @Override
    public SubmissionOutcome validate(String scenarioSlug, SubmittedAnswer answer) {
        if (!"command_text".equals(answer.type())) {
            return SubmissionOutcome.unsupported(
                    "unsupported-answer-type",
                    "This MVP validation slice only evaluates command_text answers."
            );
        }

        Set<String> acceptedCommands = SUPPORTED_COMMANDS_BY_SCENARIO.get(scenarioSlug);
        if (acceptedCommands == null) {
            return SubmissionOutcome.incorrect(
                    "validation-rule-missing",
                    "No validation rule is available for the active scenario yet."
            );
        }

        String normalizedAnswer = normalizeCommand(answer.value());
        if (acceptedCommands.contains(normalizedAnswer)) {
            return SubmissionOutcome.correct(
                    "expected-command",
                    "Submitted command matches the expected safe next action for this scenario."
            );
        }

        return SubmissionOutcome.incorrect(
                "unexpected-command",
                "Submitted command does not match the expected safe next action for this scenario."
        );
    }

    private String normalizeCommand(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toLowerCase();
    }
}
