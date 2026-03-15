package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.ScenarioCatalogSummary;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class ListScenarioCatalogUseCase {

    private final ScenarioCatalog scenarioCatalog;

    public ListScenarioCatalogUseCase(ScenarioCatalog scenarioCatalog) {
        this.scenarioCatalog = scenarioCatalog;
    }

    public List<ScenarioCatalogSummary> listSummaries() {
        return scenarioCatalog.listSummaries().stream()
                .sorted(Comparator.comparingInt(ScenarioCatalogSummary::catalogOrder))
                .toList();
    }
}
