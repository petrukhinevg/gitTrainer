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
                    "Продолжайте сценарий, который уже начали, чтобы не терять контекст."
            );
        }

        if (!untouchedItems.isEmpty()) {
            return new ProgressRecommendations(
                    solvedItems.stream().map(ProgressRecommendationPolicy::toScenario).toList(),
                    attemptedItems.stream().map(ProgressRecommendationPolicy::toScenario).toList(),
                    toScenario(untouchedItems.getFirst()),
                    "Начните следующий ещё не пройденный сценарий по порядку каталога."
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
                    "Все сценарии уже завершены, поэтому можно вернуться "
                            + "к последнему активному упражнению и повторить его."
            );
        }

        return new ProgressRecommendations(
                List.of(),
                List.of(),
                null,
                "Сейчас нет сценариев, для которых можно дать рекомендацию."
        );
    }

    private static RecommendationScenario toScenario(ProgressSummaryItem item) {
        return new RecommendationScenario(item.scenarioSlug(), item.scenarioTitle());
    }

    private static Instant sortActivityAt(ProgressSummaryItem item) {
        return item.lastActivityAt() == null ? Instant.EPOCH : item.lastActivityAt();
    }
}
