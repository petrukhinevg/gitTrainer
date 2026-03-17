package com.example.gittrainer.progress.application;

import java.util.List;

public record ProgressSummary(
        List<ProgressSummaryItem> items,
        List<RecentProgressActivity> recentActivity,
        String source
) {

    public ProgressSummary {
        items = items == null ? List.of() : List.copyOf(items);
        recentActivity = recentActivity == null ? List.of() : List.copyOf(recentActivity);
    }
}
