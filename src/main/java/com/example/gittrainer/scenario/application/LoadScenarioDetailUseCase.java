package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.scenario.domain.ScenarioDetailQuery;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import org.springframework.stereotype.Service;

@Service
public class LoadScenarioDetailUseCase {

    private final ScenarioCatalogGateway scenarioCatalogGateway;
    private final ScenarioTaskContentAssembler scenarioTaskContentAssembler;
    private final ScenarioRepositoryContextGateway scenarioRepositoryContextGateway;

    public LoadScenarioDetailUseCase(
            ScenarioCatalogGateway scenarioCatalogGateway,
            ScenarioTaskContentAssembler scenarioTaskContentAssembler,
            ScenarioRepositoryContextGateway scenarioRepositoryContextGateway
    ) {
        this.scenarioCatalogGateway = scenarioCatalogGateway;
        this.scenarioTaskContentAssembler = scenarioTaskContentAssembler;
        this.scenarioRepositoryContextGateway = scenarioRepositoryContextGateway;
    }

    public ScenarioDetailResult load(ScenarioDetailQuery query) {
        CatalogBrowseQuery catalogQuery = new CatalogBrowseQuery(null, null, null, query.source());
        ScenarioSummary scenarioSummary = scenarioCatalogGateway.loadCatalog(catalogQuery).stream()
                .filter(item -> item.slug().equals(query.slug()))
                .findFirst()
                .orElseThrow(() -> new ScenarioDetailNotFoundException(query.slug()));
        return new ScenarioDetailResult(
                new ScenarioWorkspaceDetail(
                        scenarioSummary.id(),
                        scenarioSummary.slug(),
                        scenarioSummary.title(),
                        scenarioSummary.summary(),
                        scenarioSummary.difficulty(),
                        scenarioSummary.tags(),
                        new ScenarioWorkspaceDetail.ScenarioWorkspaceShell(
                                "Карта сценария",
                                "Урок",
                                "Практика"
                        ),
                        scenarioTaskContentAssembler.assemble(scenarioSummary.slug()),
                        scenarioRepositoryContextGateway.loadRepositoryContext(scenarioSummary.slug())
                ),
                scenarioCatalogGateway.sourceName(catalogQuery),
                true
        );
    }
}
