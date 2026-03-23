package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.RetryExplanationTemplate;
import com.example.gittrainer.session.application.RetryHintTemplate;
import com.example.gittrainer.session.domain.RetryGuidanceProfile;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

@Component
public class RetryFeedbackFixtureSource {

    public Optional<RetryGuidanceProfile> findIncorrectGuidance(String scenarioSlug) {
        return AuthoredRetryFeedbackLibrary.findIncorrectGuidance(scenarioSlug);
    }

    public Optional<RetryExplanationTemplate> findExplanationTemplate(String code) {
        return AuthoredRetryFeedbackLibrary.findExplanationTemplate(code);
    }

    public Optional<RetryHintTemplate> findHintTemplate(String templateCode) {
        return AuthoredRetryFeedbackLibrary.findHintTemplate(templateCode);
    }

    public Map<String, RetryGuidanceProfile> incorrectGuidanceProfiles() {
        return AuthoredRetryFeedbackLibrary.incorrectGuidanceProfiles();
    }

    public Map<String, RetryExplanationTemplate> explanationTemplates() {
        return AuthoredRetryFeedbackLibrary.explanationTemplates();
    }

    public Map<String, RetryHintTemplate> hintTemplates() {
        return AuthoredRetryFeedbackLibrary.hintTemplates();
    }
}
