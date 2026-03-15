package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.scenario.domain.ScenarioDifficulty;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Component
public class CatalogQueryPolicy {

    public List<ScenarioSummary> apply(List<ScenarioSummary> catalog, CatalogBrowseQuery query) {
        return catalog.stream()
                .filter(item -> matchesDifficulty(item, query))
                .filter(item -> matchesTags(item, query))
                .sorted(resolveComparator(query))
                .toList();
    }

    private boolean matchesDifficulty(ScenarioSummary item, CatalogBrowseQuery query) {
        if (query.difficulty() == null || query.difficulty().isBlank()) {
            return true;
        }

        String requestedDifficulty = normalize(query.difficulty());
        return requestedDifficulty.equals(normalizeDifficulty(item.difficulty()))
                || requestedDifficulty.equals(normalize(item.difficulty().name()));
    }

    private boolean matchesTags(ScenarioSummary item, CatalogBrowseQuery query) {
        if (query.tags() == null || query.tags().isEmpty()) {
            return true;
        }

        List<String> normalizedItemTags = item.tags().stream()
                .map(this::normalize)
                .toList();

        return query.tags().stream()
                .map(this::normalize)
                .allMatch(normalizedItemTags::contains);
    }

    private Comparator<ScenarioSummary> resolveComparator(CatalogBrowseQuery query) {
        if (query.sort() == null || query.sort().isBlank()) {
            return Comparator.comparing(ScenarioSummary::title);
        }

        return switch (normalize(query.sort())) {
            case "difficulty" -> Comparator
                    .comparingInt((ScenarioSummary item) -> difficultyRank(item.difficulty()))
                    .thenComparing(ScenarioSummary::title);
            case "title" -> Comparator.comparing(ScenarioSummary::title);
            default -> Comparator.comparing(ScenarioSummary::title);
        };
    }

    private int difficultyRank(ScenarioDifficulty difficulty) {
        return switch (difficulty) {
            case BEGINNER -> 0;
            case INTERMEDIATE -> 1;
        };
    }

    private String normalizeDifficulty(ScenarioDifficulty difficulty) {
        return switch (difficulty) {
            case BEGINNER -> "beginner";
            case INTERMEDIATE -> "intermediate";
        };
    }

    private String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
