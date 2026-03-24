package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.RetryExplanationTemplate;
import com.example.gittrainer.session.application.RetryFeedbackCatalog;
import com.example.gittrainer.session.application.RetryHintTemplate;
import com.example.gittrainer.session.domain.RetryGuidanceProfile;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Profile("test")
public class SeedRetryFeedbackCatalog implements RetryFeedbackCatalog {

    private final SeedRetryFeedbackSource retryFeedbackSeedSource;

    public SeedRetryFeedbackCatalog(SeedRetryFeedbackSource retryFeedbackSeedSource) {
        this.retryFeedbackSeedSource = retryFeedbackSeedSource;
    }

    @Override
    public Optional<RetryGuidanceProfile> findIncorrectGuidance(String scenarioSlug) {
        return retryFeedbackSeedSource.findIncorrectGuidance(scenarioSlug);
    }

    @Override
    public Optional<RetryExplanationTemplate> findExplanationTemplate(String code) {
        return retryFeedbackSeedSource.findExplanationTemplate(code);
    }

    @Override
    public Optional<RetryHintTemplate> findHintTemplate(String templateCode) {
        return retryFeedbackSeedSource.findHintTemplate(templateCode);
    }
}
