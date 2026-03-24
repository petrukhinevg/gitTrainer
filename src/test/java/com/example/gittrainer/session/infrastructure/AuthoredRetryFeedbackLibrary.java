package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.RetryExplanationTemplate;
import com.example.gittrainer.session.application.RetryHintTemplate;
import com.example.gittrainer.session.domain.RetryGuidanceProfile;

import java.util.Map;
import java.util.Optional;

public final class AuthoredRetryFeedbackLibrary {

    private static final AuthoredRetryFeedbackResourceLoader RESOURCE_LOADER =
            new AuthoredRetryFeedbackResourceLoader();

    private AuthoredRetryFeedbackLibrary() {
    }

    public static Optional<RetryGuidanceProfile> findIncorrectGuidance(String scenarioSlug) {
        return RESOURCE_LOADER.findProfile(scenarioSlug);
    }

    public static Optional<RetryExplanationTemplate> findExplanationTemplate(String code) {
        return RESOURCE_LOADER.findExplanationTemplate(code);
    }

    public static Optional<RetryHintTemplate> findHintTemplate(String templateCode) {
        return RESOURCE_LOADER.findHintTemplate(templateCode);
    }

    public static Map<String, RetryGuidanceProfile> incorrectGuidanceProfiles() {
        return RESOURCE_LOADER.profiles();
    }

    public static Map<String, RetryExplanationTemplate> explanationTemplates() {
        return RESOURCE_LOADER.explanationTemplates();
    }

    public static Map<String, RetryHintTemplate> hintTemplates() {
        return RESOURCE_LOADER.hintTemplates();
    }
}
