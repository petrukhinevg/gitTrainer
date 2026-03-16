package com.example.gittrainer.validation.application;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.domain.SubmissionOutcome;

public interface SubmissionAnswerValidator {

    SubmissionOutcome validate(String scenarioSlug, SubmittedAnswer answer);
}
