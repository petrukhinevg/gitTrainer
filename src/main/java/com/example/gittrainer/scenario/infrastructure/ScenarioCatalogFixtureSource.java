package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.domain.ScenarioDifficulty;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ScenarioCatalogFixtureSource {

    private static final ScenarioCatalogFixture DEFAULT_CATALOG = new ScenarioCatalogFixture(
            "mvp-fixture",
            List.of(
                    new ScenarioSummary(
                            "status-basics",
                            "status-basics",
                            "Сначала проверь рабочее дерево",
                            "Посмотри на шумный репозиторий и выбери следующую безопасную Git-команду до любых изменений.",
                            ScenarioDifficulty.BEGINNER,
                            List.of("status", "working-tree", "basics")
                    ),
                    new ScenarioSummary(
                            "branch-safety",
                            "branch-safety",
                            "Подтверди текущую ветку перед правками",
                            "Сначала выясни, на какой ветке уже есть незавершённые изменения, и только потом решай, допустимо ли переключение.",
                            ScenarioDifficulty.BEGINNER,
                            List.of("branching", "navigation", "basics")
                    ),
                    new ScenarioSummary(
                            "history-cleanup-preview",
                            "history-cleanup-preview",
                            "Просмотри историю перед очисткой",
                            "Сначала собери компактный preview последних коммитов с `fixup!` и WIP-сигналами, а уже потом решай, как чистить историю.",
                            ScenarioDifficulty.INTERMEDIATE,
                            List.of("history", "cleanup", "planning")
                    ),
                    new ScenarioSummary(
                            "remote-sync-preview",
                            "remote-sync-preview",
                            "Сначала обнови удалённое состояние",
                            "Подтверди, что локальные данные об `origin/main` могли устареть, и начни с `fetch`, а не с немедленного `pull`.",
                            ScenarioDifficulty.INTERMEDIATE,
                            List.of("remote", "inspection", "planning")
                    )
            )
    );

    private static final ScenarioCatalogFixture EMPTY_CATALOG = new ScenarioCatalogFixture(
            "mvp-fixture-empty",
            List.of()
    );

    public ScenarioCatalogFixture defaultCatalog() {
        return DEFAULT_CATALOG;
    }

    public ScenarioCatalogFixture emptyCatalog() {
        return EMPTY_CATALOG;
    }

    public ScenarioCatalogFixture unavailableCatalog() {
        throw new ScenarioCatalogSourceUnavailableException(
                "mvp-fixture-unavailable",
                "Источник каталога сейчас недоступен. Выберите другой источник или повторите позже."
        );
    }
}
