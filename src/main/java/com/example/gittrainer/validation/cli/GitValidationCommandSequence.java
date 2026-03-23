package com.example.gittrainer.validation.cli;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.CommandTextNormalizer;
import com.example.gittrainer.validation.application.ScenarioValidationRule;

import java.util.List;
import java.util.Set;

final class GitValidationCommandSequence {

    private GitValidationCommandSequence() {
    }

    static PreparedCommandSequence prepare(CliValidationRequest request) {
        String normalizedAnswer = CommandTextNormalizer.normalize(request.answer().value());
        ScenarioValidationRule matchedRule = request.spec().rules().stream()
                .filter(rule -> rule.normalizedAnswerValue().equals(normalizedAnswer))
                .findFirst()
                .orElse(null);
        Set<String> allowedCommands = request.spec().rules().stream()
                .map(ScenarioValidationRule::normalizedAnswerValue)
                .collect(java.util.stream.Collectors.toSet());
        List<List<String>> commandTokens = allAnswers(request).stream()
                .filter(answer -> "command_text".equals(answer.type()))
                .filter(answer -> allowedCommands.contains(CommandTextNormalizer.normalize(answer.value())))
                .map(SubmittedAnswer::value)
                .map(GitCliSupport::tokenizeGitCommand)
                .toList();

        return new PreparedCommandSequence(normalizedAnswer, matchedRule, commandTokens);
    }

    private static List<SubmittedAnswer> allAnswers(CliValidationRequest request) {
        return java.util.stream.Stream.concat(request.priorAnswers().stream(), java.util.stream.Stream.of(request.answer()))
                .toList();
    }

    record PreparedCommandSequence(
            String normalizedAnswer,
            ScenarioValidationRule matchedRule,
            List<List<String>> commandTokens
    ) {
    }
}
