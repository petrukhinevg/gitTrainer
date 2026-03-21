package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.scenario.domain.ScenarioDetailQuery;
import com.example.gittrainer.scenario.domain.ScenarioDifficulty;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoadScenarioDetailUseCaseTest {

    @Mock
    private ScenarioCatalogGateway scenarioCatalogGateway;

    @Mock
    private ScenarioTaskContentAssembler scenarioTaskContentAssembler;

    @Mock
    private ScenarioRepositoryContextGateway scenarioRepositoryContextGateway;

    @InjectMocks
    private LoadScenarioDetailUseCase loadScenarioDetailUseCase;

    @Test
    void assemblesScenarioDetailFromApplicationPorts() {
        ScenarioDetailQuery query = new ScenarioDetailQuery("status-basics", "default");
        ScenarioSummary summary = new ScenarioSummary(
                "status-basics",
                "status-basics",
                "Сначала проверь рабочее дерево",
                "Посмотри на шумный репозиторий и выбери следующую безопасную Git-команду до любых изменений.",
                ScenarioDifficulty.BEGINNER,
                List.of("status", "working-tree", "basics")
        );
        ScenarioWorkspaceDetail.ScenarioTaskPreview taskPreview = new ScenarioWorkspaceDetail.ScenarioTaskPreview(
                "authored-fixture",
                "goal",
                List.of(),
                List.of(),
                List.of()
        );
        ScenarioWorkspaceDetail.ScenarioRepositoryContext repositoryContext =
                new ScenarioWorkspaceDetail.ScenarioRepositoryContext("authored-fixture", List.of(), List.of(), List.of(), List.of());

        when(scenarioCatalogGateway.loadCatalog(new CatalogBrowseQuery(null, null, null, "default")))
                .thenReturn(List.of(summary));
        when(scenarioCatalogGateway.sourceName(new CatalogBrowseQuery(null, null, null, "default")))
                .thenReturn("mvp-fixture");
        when(scenarioTaskContentAssembler.assemble("status-basics")).thenReturn(taskPreview);
        when(scenarioRepositoryContextGateway.loadRepositoryContext("status-basics")).thenReturn(repositoryContext);

        ScenarioDetailResult result = loadScenarioDetailUseCase.load(query);

        assertThat(result.source()).isEqualTo("mvp-fixture");
        assertThat(result.stub()).isTrue();
        assertThat(result.detail().slug()).isEqualTo("status-basics");
        assertThat(result.detail().title()).isEqualTo("Сначала проверь рабочее дерево");
        assertThat(result.detail().task()).isEqualTo(taskPreview);
        assertThat(result.detail().repositoryContext()).isEqualTo(repositoryContext);

        verify(scenarioCatalogGateway).loadCatalog(new CatalogBrowseQuery(null, null, null, "default"));
        verify(scenarioCatalogGateway).sourceName(new CatalogBrowseQuery(null, null, null, "default"));
        verify(scenarioTaskContentAssembler).assemble("status-basics");
        verify(scenarioRepositoryContextGateway).loadRepositoryContext("status-basics");
    }

    @Test
    void failsWhenScenarioSlugIsMissingFromSelectedSource() {
        ScenarioDetailQuery query = new ScenarioDetailQuery("missing-scenario", "empty");

        when(scenarioCatalogGateway.loadCatalog(new CatalogBrowseQuery(null, null, null, "empty")))
                .thenReturn(List.of());

        assertThatThrownBy(() -> loadScenarioDetailUseCase.load(query))
                .isInstanceOf(ScenarioDetailNotFoundException.class)
                .hasMessage("Сценарий не найден: missing-scenario");

        verify(scenarioCatalogGateway).loadCatalog(new CatalogBrowseQuery(null, null, null, "empty"));
        verifyNoInteractions(scenarioTaskContentAssembler, scenarioRepositoryContextGateway);
    }
}
