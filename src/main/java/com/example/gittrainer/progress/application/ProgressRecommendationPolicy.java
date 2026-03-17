package com.example.gittrainer.progress.application;

import com.example.gittrainer.progress.domain.ProgressStatus;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

public final class ProgressRecommendationPolicy {

    private ProgressRecommendationPolicy() {
    }

    public static ProgressRecommendations derive(List<ProgressSummaryItem> items) {
        List<ProgressSummaryItem> solvedItems = items.stream()
                .filter(item -> item.status() == ProgressStatus.COMPLETED)
                .toList();
        List<ProgressSummaryItem> attemptedItems = items.stream()
                .filter(item -> item.status() == ProgressStatus.IN_PROGRESS)
                .toList();
        List<ProgressSummaryItem> untouchedItems = items.stream()
                .filter(item -> item.status() == ProgressStatus.NOT_STARTED)
                .toList();

        if (!attemptedItems.isEmpty()) {
            ProgressSummaryItem nextItem = attemptedItems.stream()
                    .max(Comparator.comparing(ProgressRecommendationPolicy::sortActivityAt)
                            .thenComparing(ProgressSummaryItem::scenarioTitle))
                    .orElseThrow();
            return new ProgressRecommendations(
                    solvedItems.stream().map(ProgressRecommendationPolicy::toScenario).toList(),
                    attemptedItems.stream().map(ProgressRecommendationPolicy::toScenario).toList(),
                    toScenario(nextItem),
                    "Продолжайте сценарий, в котором уже есть незавершённый прогресс."
            );
        }

        if (!untouchedItems.isEmpty()) {
            return new ProgressRecommendations(
                    solvedItems.stream().map(ProgressRecommendationPolicy::toScenario).toList(),
                    attemptedItems.stream().map(ProgressRecommendationPolicy::toScenario).toList(),
                    toScenario(untouchedItems.getFirst()),
                    "Начните следующий нетронутый сценарий в текущем порядке каталога."
            );
        }

        if (!solvedItems.isEmpty()) {
            ProgressSummaryItem revisitItem = solvedItems.stream()
                    .max(Comparator.comparing(ProgressRecommendationPolicy::sortActivityAt)
                            .thenComparing(ProgressSummaryItem::scenarioTitle))
                    .orElseThrow();
            return new ProgressRecommendations(
                    solvedItems.stream().map(ProgressRecommendationPolicy::toScenario).toList(),
                    List.of(),
                    toScenario(revisitItem),
                    "Все текущие сценарии уже завершены, поэтому вернитесь к самому недавно активному упражнению."
            );
        }

        return new ProgressRecommendations(
                List.of(),
                List.of(),
                null,
                "В каталоге нет сценариев для рекомендации."
        );
    }

    private static RecommendationScenario toScenario(ProgressSummaryItem item) {
        return new RecommendationScenario(item.scenarioSlug(), item.scenarioTitle());
    }

    private static Instant sortActivityAt(ProgressSummaryItem item) {
        return item.lastActivityAt() == null ? Instant.EPOCH : item.lastActivityAt();
    }
}
