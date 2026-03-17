package com.example.gittrainer.progress.api;

import com.example.gittrainer.progress.application.ProgressSummary;
import com.example.gittrainer.progress.application.ProgressSummaryItem;
import com.example.gittrainer.progress.application.RecentProgressActivity;
import org.springframework.stereotype.Component;

@Component
public class ProgressSummaryResponseMapper {

    public ProgressSummaryResponse toResponse(ProgressSummary summary) {
        return new ProgressSummaryResponse(
                summary.items().stream().map(this::toItemResponse).toList(),
                summary.recentActivity().stream().map(this::toRecentActivityResponse).toList(),
                new ProgressSummaryMetaResponse(summary.source())
        );
    }

    private ProgressSummaryItemResponse toItemResponse(ProgressSummaryItem item) {
        return new ProgressSummaryItemResponse(
                item.scenarioSlug(),
                item.scenarioTitle(),
                item.status().name().toLowerCase(java.util.Locale.ROOT),
                item.attemptCount(),
                item.completionCount(),
                item.lastActivityAt()
        );
    }

    private RecentProgressActivityResponse toRecentActivityResponse(RecentProgressActivity activity) {
        return new RecentProgressActivityResponse(
                activity.scenarioSlug(),
                activity.scenarioTitle(),
                activity.status().name().toLowerCase(java.util.Locale.ROOT),
                activity.eventType(),
                activity.happenedAt()
        );
    }
}
