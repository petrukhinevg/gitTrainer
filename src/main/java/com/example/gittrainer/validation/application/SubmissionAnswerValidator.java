package com.example.gittrainer.validation.application;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.domain.SubmissionValidationResult;

public interface SubmissionAnswerValidator {

    SubmissionValidationResult validate(String scenarioSlug, SubmittedAnswer answer);
}
