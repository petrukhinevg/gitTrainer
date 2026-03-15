package com.example.gittrainer.session.application;

import java.util.List;

final class SessionSubmissionAnswerTypes {

    private static final List<String> SUPPORTED_ANSWER_TYPES = List.of("command_text");

    private SessionSubmissionAnswerTypes() {
    }

    static List<String> supportedAnswerTypes() {
        return SUPPORTED_ANSWER_TYPES;
    }

    static boolean isSupported(String answerType) {
        return SUPPORTED_ANSWER_TYPES.contains(answerType);
    }
}
