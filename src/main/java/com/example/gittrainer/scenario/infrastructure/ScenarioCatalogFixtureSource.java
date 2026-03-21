package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioSourceUnavailableException;
import com.example.gittrainer.scenario.domain.ScenarioDifficulty;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ScenarioCatalogFixtureSource {

    private static final ScenarioCatalogFixture DEFAULT_CATALOG = new ScenarioCatalogFixture(
            "mvp-fixture",
            List.of(
                    summary(
                            "status-basics",
                            "status-basics",
                            "Сначала проверь рабочее дерево",
                            "Посмотри на шумный репозиторий и выбери "
                                    + "следующую безопасную Git-команду "
                                    + "до любых изменений.",
                            ScenarioDifficulty.BEGINNER,
                            List.of("status", "working-tree", "basics")
                    ),
                    summary(
                            "branch-safety",
                            "branch-safety",
                            "Подтверди текущую ветку перед правками",
                            "Сначала выясни, на какой ветке уже есть "
                                    + "незавершённые изменения, и только потом "
                                    + "решай, допустимо ли переключение.",
                            ScenarioDifficulty.BEGINNER,
                            List.of("branching", "navigation", "basics")
                    ),
                    summary(
                            "history-cleanup-preview",
                            "history-cleanup-preview",
                            "Просмотри историю перед очисткой",
                            "Сначала собери компактный preview последних "
                                    + "коммитов с `fixup!` и WIP-сигналами, "
                                    + "а уже потом решай, как чистить историю.",
                            ScenarioDifficulty.INTERMEDIATE,
                            List.of("history", "cleanup", "planning")
                    ),
                    summary(
                            "remote-sync-preview",
                            "remote-sync-preview",
                            "Сначала обнови удалённое состояние",
                            "Подтверди, что локальные данные об `origin/main` "
                                    + "могли устареть, и начни с `fetch`, "
                                    + "а не с немедленного `pull`.",
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
        throw new ScenarioSourceUnavailableException(
                "mvp-fixture-unavailable",
                "Источник каталога сейчас недоступен. Выберите другой источник или повторите позже."
        );
    }

    private static ScenarioSummary summary(
            String id,
            String slug,
            String title,
            String summary,
            ScenarioDifficulty difficulty,
            List<String> tags
    ) {
        return new ScenarioSummary(id, slug, title, summary, difficulty, tags);
    }
}
