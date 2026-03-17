package com.example.gittrainer.progress.api;

public record ProgressSummaryItemResponse(
        String scenarioSlug,
        String scenarioTitle,
        String status
) {
}
