package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.RetryExplanationTemplate;
import com.example.gittrainer.session.application.RetryFeedbackCatalog;
import com.example.gittrainer.session.application.RetryHintTemplate;
import com.example.gittrainer.session.domain.RetryGuidanceProfile;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Profile("test | local-memory")
public class FixtureRetryFeedbackCatalog implements RetryFeedbackCatalog {

    private final RetryFeedbackFixtureSource retryFeedbackFixtureSource;

    public FixtureRetryFeedbackCatalog(RetryFeedbackFixtureSource retryFeedbackFixtureSource) {
        this.retryFeedbackFixtureSource = retryFeedbackFixtureSource;
    }

    @Override
    public Optional<RetryGuidanceProfile> findIncorrectGuidance(String scenarioSlug) {
        return retryFeedbackFixtureSource.findIncorrectGuidance(scenarioSlug);
    }

    @Override
    public Optional<RetryExplanationTemplate> findExplanationTemplate(String code) {
        return retryFeedbackFixtureSource.findExplanationTemplate(code);
    }

    @Override
    public Optional<RetryHintTemplate> findHintTemplate(String templateCode) {
        return retryFeedbackFixtureSource.findHintTemplate(templateCode);
    }
}
