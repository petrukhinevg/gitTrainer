package com.example.gittrainer.progress.api;

import com.example.gittrainer.progress.application.ProgressSummary;
import com.example.gittrainer.progress.application.ProgressSummaryItem;
import org.springframework.stereotype.Component;

@Component
public class ProgressSummaryResponseMapper {

    public ProgressSummaryResponse toResponse(ProgressSummary summary) {
        return new ProgressSummaryResponse(summary.items().stream().map(this::toItemResponse).toList());
    }

    private ProgressSummaryItemResponse toItemResponse(ProgressSummaryItem item) {
        return new ProgressSummaryItemResponse(
                item.scenarioSlug(),
                item.scenarioTitle(),
                item.status().name().toLowerCase(java.util.Locale.ROOT)
        );
    }
}
