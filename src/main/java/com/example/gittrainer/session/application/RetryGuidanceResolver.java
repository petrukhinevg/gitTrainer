package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.RetryGuidance;
import com.example.gittrainer.session.domain.RetryGuidancePolicy;
import com.example.gittrainer.session.domain.RetryGuidanceProfile;
import com.example.gittrainer.session.domain.RetryState;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.springframework.stereotype.Service;

@Service
public class RetryGuidanceResolver {

    private final RetryFeedbackCatalog retryFeedbackCatalog;

    public RetryGuidanceResolver(RetryFeedbackCatalog retryFeedbackCatalog) {
        this.retryFeedbackCatalog = retryFeedbackCatalog;
    }

    public RetryGuidance resolve(String scenarioSlug, SubmissionOutcome outcome, RetryState retryState) {
        RetryGuidanceProfile incorrectGuidance = retryFeedbackCatalog.findIncorrectGuidance(scenarioSlug)
                .orElse(RetryGuidanceProfile.fallback());
        return RetryGuidancePolicy.selectGuidance(incorrectGuidance, outcome, retryState);
    }
}
