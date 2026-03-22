package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.RetryGuidanceProfile;

import java.util.Optional;

public interface RetryFeedbackCatalog {

    Optional<RetryGuidanceProfile> findIncorrectGuidance(String scenarioSlug);

    Optional<RetryExplanationTemplate> findExplanationTemplate(String code);

    Optional<RetryHintTemplate> findHintTemplate(String templateCode);
}
