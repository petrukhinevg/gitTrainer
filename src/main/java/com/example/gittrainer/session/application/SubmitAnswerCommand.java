package com.example.gittrainer.session.application;

public record SubmitAnswerCommand(
        String answerType,
        String answer
) {

    public SubmitAnswerCommand {
        answerType = normalizeAnswerType(answerType);
        answer = normalizeAnswer(answer);
    }

    private static String normalizeAnswerType(String value) {
        if (value == null || value.isBlank()) {
            return "command_text";
        }
        return value.trim().toLowerCase();
    }

    private static String normalizeAnswer(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }
}
