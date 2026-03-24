package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.RetryExplanationTemplate;
import com.example.gittrainer.session.application.RetryHintTemplate;
import com.example.gittrainer.session.domain.RetryGuidanceProfile;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

@Component
public class SeedRetryFeedbackSource {

    public Optional<RetryGuidanceProfile> findIncorrectGuidance(String scenarioSlug) {
        return SeedRetryFeedbackLibrary.findIncorrectGuidance(scenarioSlug);
    }

    public Optional<RetryExplanationTemplate> findExplanationTemplate(String code) {
        return SeedRetryFeedbackLibrary.findExplanationTemplate(code);
    }

    public Optional<RetryHintTemplate> findHintTemplate(String templateCode) {
        return SeedRetryFeedbackLibrary.findHintTemplate(templateCode);
    }

    public Map<String, RetryGuidanceProfile> incorrectGuidanceProfiles() {
        return SeedRetryFeedbackLibrary.incorrectGuidanceProfiles();
    }

    public Map<String, RetryExplanationTemplate> explanationTemplates() {
        return SeedRetryFeedbackLibrary.explanationTemplates();
    }

    public Map<String, RetryHintTemplate> hintTemplates() {
        return SeedRetryFeedbackLibrary.hintTemplates();
    }
}
