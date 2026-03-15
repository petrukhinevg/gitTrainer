package com.example.gittrainer.scenario.domain;

public record ScenarioDetailQuery(
        String slug,
        String source
) {

    public ScenarioDetailQuery {
        slug = slug == null ? "" : slug.trim();
        source = source == null || source.isBlank() ? null : source.trim();
    }
}
