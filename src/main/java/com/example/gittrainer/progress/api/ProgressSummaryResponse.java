package com.example.gittrainer.progress.api;

import java.util.List;

public record ProgressSummaryResponse(
        List<ProgressSummaryItemResponse> items
) {
}
