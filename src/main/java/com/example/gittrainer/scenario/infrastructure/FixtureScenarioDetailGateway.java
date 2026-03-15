package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioDetailGateway;
import com.example.gittrainer.scenario.domain.ScenarioDetailQuery;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class FixtureScenarioDetailGateway implements ScenarioDetailGateway {

    private final ScenarioCatalogFixtureSource scenarioCatalogFixtureSource;

    public FixtureScenarioDetailGateway(ScenarioCatalogFixtureSource scenarioCatalogFixtureSource) {
        this.scenarioCatalogFixtureSource = scenarioCatalogFixtureSource;
    }

    @Override
    public Optional<ScenarioWorkspaceDetail> loadScenarioDetail(ScenarioDetailQuery query) {
        return resolveFixture(query).items().stream()
                .filter(item -> item.slug().equals(query.slug()))
                .findFirst()
                .map(this::toStubDetail);
    }

    @Override
    public String sourceName(ScenarioDetailQuery query) {
        return resolveFixture(query).sourceName();
    }

    private ScenarioCatalogFixture resolveFixture(ScenarioDetailQuery query) {
        String source = query.source();
        if (source == null || source.isBlank() || source.equalsIgnoreCase("default")) {
            return scenarioCatalogFixtureSource.defaultCatalog();
        }
        if (source.equalsIgnoreCase("empty")) {
            return scenarioCatalogFixtureSource.emptyCatalog();
        }
        if (source.equalsIgnoreCase("unavailable")) {
            return scenarioCatalogFixtureSource.unavailableCatalog();
        }

        return scenarioCatalogFixtureSource.defaultCatalog();
    }

    private ScenarioWorkspaceDetail toStubDetail(ScenarioSummary scenarioSummary) {
        return new ScenarioWorkspaceDetail(
                scenarioSummary.id(),
                scenarioSummary.slug(),
                scenarioSummary.title(),
                scenarioSummary.summary(),
                scenarioSummary.difficulty(),
                scenarioSummary.tags(),
                new ScenarioWorkspaceDetail.ScenarioWorkspaceShell(
                        "Scenario map",
                        "Workspace lesson",
                        "Workspace lane"
                ),
                new ScenarioWorkspaceDetail.ScenarioTaskPreview(
                        "stub",
                        "Task content arrives in sub-issue 2.2.",
                        List.of(),
                        List.of()
                ),
                new ScenarioWorkspaceDetail.ScenarioRepositoryContext(
                        "stub",
                        List.of(),
                        List.of(),
                        List.of(),
                        List.of()
                )
        );
    }
}
