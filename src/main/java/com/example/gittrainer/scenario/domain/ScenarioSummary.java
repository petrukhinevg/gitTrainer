package com.example.gittrainer.scenario.domain;

import java.util.List;

public record ScenarioSummary(
        String id,
        String slug,
        String title,
        String summary,
        ScenarioDifficulty difficulty,
        List<String> tags
) {

    public ScenarioSummary {
        tags = tags == null ? List.of() : List.copyOf(tags);
    }
}
