package com.example.gittrainer.session.application;

public record StartSessionCommand(
        String scenarioSlug,
        String source
) {

    public StartSessionCommand {
        scenarioSlug = normalize(scenarioSlug);
        source = normalize(source);
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
