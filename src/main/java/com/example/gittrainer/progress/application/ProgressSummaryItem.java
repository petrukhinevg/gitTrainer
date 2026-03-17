package com.example.gittrainer.progress.application;

import com.example.gittrainer.progress.domain.ProgressStatus;

public record ProgressSummaryItem(
        String scenarioSlug,
        String scenarioTitle,
        ProgressStatus status
) {
}
