package com.example.gittrainer.validation.application;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.domain.SubmissionValidationResult;

import java.util.List;

public interface SubmissionAnswerValidator {

    default SubmissionValidationResult validate(String scenarioSlug, SubmittedAnswer answer) {
        return validate(null, scenarioSlug, List.of(), answer);
    }

    default SubmissionValidationResult validate(
            String scenarioSlug,
            List<SubmittedAnswer> priorAnswers,
            SubmittedAnswer answer
    ) {
        return validate(null, scenarioSlug, priorAnswers, answer);
    }

    SubmissionValidationResult validate(
            String sessionId,
            String scenarioSlug,
            List<SubmittedAnswer> priorAnswers,
            SubmittedAnswer answer
    );
}
