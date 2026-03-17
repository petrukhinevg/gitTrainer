package com.example.gittrainer.progress.application;

import java.util.List;

public record ProgressRecommendations(
        List<RecommendationScenario> solved,
        List<RecommendationScenario> attempted,
        RecommendationScenario next,
        String rationale
) {

    public ProgressRecommendations {
        solved = solved == null ? List.of() : List.copyOf(solved);
        attempted = attempted == null ? List.of() : List.copyOf(attempted);
    }

    public static ProgressRecommendations placeholder() {
        return new ProgressRecommendations(
                List.of(),
                List.of(),
                null,
                "Recommendation policy will attach here once the next-step rule set is wired."
        );
    }
}
