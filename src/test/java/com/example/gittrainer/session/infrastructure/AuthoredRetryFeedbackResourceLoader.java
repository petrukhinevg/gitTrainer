package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.RetryExplanationTemplate;
import com.example.gittrainer.session.application.RetryHintTemplate;
import com.example.gittrainer.session.domain.RetryGuidanceProfile;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

final class AuthoredRetryFeedbackResourceLoader {

    private static final String RESOURCE_PATH = "session/authored-retry-feedback.json";

    private final Map<String, RetryGuidanceProfile> profiles;
    private final Map<String, RetryExplanationTemplate> explanationTemplates;
    private final Map<String, RetryHintTemplate> hintTemplates;

    AuthoredRetryFeedbackResourceLoader() {
        RetryFeedbackBundleResource bundle = readBundle();
        this.profiles = toOrderedMap(bundle.profiles(), RetryGuidanceProfileResource::toProfile);
        this.explanationTemplates = toOrderedMap(bundle.explanationTemplates(), RetryExplanationTemplateResource::toTemplate);
        this.hintTemplates = toOrderedMap(bundle.hintTemplates(), RetryHintTemplateResource::toTemplate);
    }

    Optional<RetryGuidanceProfile> findProfile(String scenarioSlug) {
        return Optional.ofNullable(profiles.get(scenarioSlug));
    }

    Optional<RetryExplanationTemplate> findExplanationTemplate(String code) {
        return Optional.ofNullable(explanationTemplates.get(code));
    }

    Optional<RetryHintTemplate> findHintTemplate(String templateCode) {
        return Optional.ofNullable(hintTemplates.get(templateCode));
    }

    Map<String, RetryGuidanceProfile> profiles() {
        return profiles;
    }

    Map<String, RetryExplanationTemplate> explanationTemplates() {
        return explanationTemplates;
    }

    Map<String, RetryHintTemplate> hintTemplates() {
        return hintTemplates;
    }

    private RetryFeedbackBundleResource readBundle() {
        ObjectMapper objectMapper = JsonMapper.builder()
                .findAndAddModules()
                .build();
        try (InputStream inputStream = new ClassPathResource(RESOURCE_PATH).getInputStream()) {
            return objectMapper.readValue(inputStream, RetryFeedbackBundleResource.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Не удалось десериализовать authored retry feedback bundle.", exception);
        } catch (IOException exception) {
            throw new IllegalStateException("Не удалось загрузить authored retry feedback bundle.", exception);
        }
    }

    private static <T, R> Map<String, R> toOrderedMap(Map<String, T> source, java.util.function.Function<T, R> mapper) {
        if (source == null || source.isEmpty()) {
            return Map.of();
        }
        LinkedHashMap<String, R> ordered = new LinkedHashMap<>();
        source.forEach((key, value) -> ordered.put(key, mapper.apply(value)));
        return Map.copyOf(ordered);
    }

    private record RetryFeedbackBundleResource(
            Map<String, RetryGuidanceProfileResource> profiles,
            Map<String, RetryExplanationTemplateResource> explanationTemplates,
            Map<String, RetryHintTemplateResource> hintTemplates
    ) {
    }

    private record RetryGuidanceProfileResource(
            String explanationCode,
            String focus,
            String hintTemplateCode
    ) {

        private RetryGuidanceProfile toProfile() {
            return new RetryGuidanceProfile(explanationCode, focus, hintTemplateCode);
        }
    }

    private record RetryExplanationTemplateResource(
            String title,
            String tone,
            String messageTemplate,
            List<String> details
    ) {

        private RetryExplanationTemplate toTemplate() {
            return new RetryExplanationTemplate(title, tone, messageTemplate, details);
        }
    }

    private record RetryHintTemplateResource(
            String nudgeTitle,
            String nudgeMessage,
            String strongTitle,
            String strongMessage
    ) {

        private RetryHintTemplate toTemplate() {
            return new RetryHintTemplate(nudgeTitle, nudgeMessage, strongTitle, strongMessage);
        }
    }
}
