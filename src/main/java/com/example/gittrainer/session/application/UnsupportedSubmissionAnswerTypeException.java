package com.example.gittrainer.session.application;

import java.util.List;

public class UnsupportedSubmissionAnswerTypeException extends RuntimeException {

    private final String requestedAnswerType;
    private final List<String> supportedAnswerTypes;

    public UnsupportedSubmissionAnswerTypeException(String requestedAnswerType, List<String> supportedAnswerTypes) {
        super("Answer type is unsupported for this session boundary: " + requestedAnswerType);
        this.requestedAnswerType = requestedAnswerType;
        this.supportedAnswerTypes = List.copyOf(supportedAnswerTypes);
    }

    public String errorCode() {
        return "unsupported-answer-type";
    }

    public String requestedAnswerType() {
        return requestedAnswerType;
    }

    public List<String> supportedAnswerTypes() {
        return supportedAnswerTypes;
    }
}
