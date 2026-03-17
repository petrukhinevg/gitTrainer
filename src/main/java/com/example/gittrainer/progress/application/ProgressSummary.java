package com.example.gittrainer.progress.application;

import java.util.List;

public record ProgressSummary(
        List<ProgressSummaryItem> items
) {
}
