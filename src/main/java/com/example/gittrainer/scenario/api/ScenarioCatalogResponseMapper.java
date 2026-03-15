package com.example.gittrainer.scenario.api;

import com.example.gittrainer.scenario.application.CatalogBrowseResult;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import org.springframework.stereotype.Component;

@Component
public class ScenarioCatalogResponseMapper {

    public ScenarioCatalogResponse toResponse(CatalogBrowseResult result) {
        return new ScenarioCatalogResponse(
                result.items().stream().map(this::toItemResponse).toList(),
                new ScenarioCatalogMetaResponse(
                        result.source(),
                        new ScenarioCatalogQueryResponse(
                                result.query().difficulty(),
                                result.query().tags(),
                                result.query().sort()
                        )
                )
        );
    }

    private ScenarioSummaryResponse toItemResponse(ScenarioSummary scenarioSummary) {
        return new ScenarioSummaryResponse(
                scenarioSummary.id(),
                scenarioSummary.slug(),
                scenarioSummary.title(),
                scenarioSummary.summary(),
                scenarioSummary.difficulty().name(),
                scenarioSummary.tags()
        );
    }
}
