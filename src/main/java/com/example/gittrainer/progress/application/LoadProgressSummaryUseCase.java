package com.example.gittrainer.progress.application;

import com.example.gittrainer.progress.domain.ProgressStatus;
import com.example.gittrainer.progress.domain.ProgressStatusPolicy;
import com.example.gittrainer.progress.domain.ScenarioProgressRecord;
import com.example.gittrainer.scenario.application.BrowseScenarioCatalogUseCase;
import com.example.gittrainer.scenario.application.CatalogBrowseResult;
import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
public class LoadProgressSummaryUseCase {

    private final BrowseScenarioCatalogUseCase browseScenarioCatalogUseCase;
    private final ProgressRepository progressRepository;

    public LoadProgressSummaryUseCase(
            BrowseScenarioCatalogUseCase browseScenarioCatalogUseCase,
            ProgressRepository progressRepository
    ) {
        this.browseScenarioCatalogUseCase = browseScenarioCatalogUseCase;
        this.progressRepository = progressRepository;
    }

    public ProgressSummary load() {
        CatalogBrowseResult catalogBrowseResult = browseScenarioCatalogUseCase.browse(
                new CatalogBrowseQuery(null, null, null, null)
        );
        Map<String, ScenarioProgressRecord> progressByScenario = progressRepository.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(ScenarioProgressRecord::scenarioSlug, Function.identity()));

        List<ProgressSummaryItem> items = catalogBrowseResult.items().stream()
                .map(item -> toSummaryItem(item, progressByScenario.get(item.slug())))
                .toList();

        List<RecentProgressActivity> recentActivity = catalogBrowseResult.items().stream()
                .map(item -> toRecentActivity(item, progressByScenario.get(item.slug())))
                .filter(java.util.Objects::nonNull)
                .sorted(Comparator.comparing(RecentProgressActivity::happenedAt).reversed())
                .toList();

        return new ProgressSummary(
                items,
                recentActivity,
                ProgressRecommendationPolicy.derive(items),
                catalogBrowseResult.source()
        );
    }

    private ProgressSummaryItem toSummaryItem(ScenarioSummary scenarioSummary, ScenarioProgressRecord progressRecord) {
        ProgressStatus status = ProgressStatusPolicy.deriveStatus(progressRecord);
        return new ProgressSummaryItem(
                scenarioSummary.slug(),
                scenarioSummary.title(),
                status,
                progressRecord == null ? 0 : progressRecord.attemptCount(),
                progressRecord == null ? 0 : progressRecord.completionCount(),
                progressRecord == null ? null : latestActivityAt(progressRecord)
        );
    }

    private RecentProgressActivity toRecentActivity(ScenarioSummary scenarioSummary, ScenarioProgressRecord progressRecord) {
        if (progressRecord == null) {
            return null;
        }
        Instant latestActivityAt = latestActivityAt(progressRecord);
        if (latestActivityAt == null) {
            return null;
        }

        return new RecentProgressActivity(
                scenarioSummary.slug(),
                scenarioSummary.title(),
                ProgressStatusPolicy.deriveStatus(progressRecord),
                latestEventType(progressRecord, latestActivityAt),
                latestActivityAt
        );
    }

    private Instant latestActivityAt(ScenarioProgressRecord progressRecord) {
        return java.util.stream.Stream.of(
                        progressRecord.lastCompletedAt(),
                        progressRecord.lastSubmittedAt(),
                        progressRecord.lastStartedAt()
                )
                .filter(java.util.Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);
    }

    private String latestEventType(ScenarioProgressRecord progressRecord, Instant latestActivityAt) {
        if (latestActivityAt.equals(progressRecord.lastCompletedAt())) {
            return "completed";
        }
        if (latestActivityAt.equals(progressRecord.lastSubmittedAt())) {
            return "attempted";
        }
        return "started";
    }
}
