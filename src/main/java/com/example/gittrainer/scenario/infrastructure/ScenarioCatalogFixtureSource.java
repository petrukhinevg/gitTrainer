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
                            "Выбери правильную ветку перед правками",
                            "Определи активную ветку, сопоставь её с задачей и реши, оставаться ли на месте или сначала переключиться.",
                            ScenarioDifficulty.BEGINNER,
                            List.of("branching", "navigation", "basics")
                    ),
                    new ScenarioSummary(
                            "history-cleanup-preview",
                            "history-cleanup-preview",
                            "Просмотри план очистки истории",
                            "Разбери запутанный стек коммитов и подготовься к дальнейшей очистке, пока ещё не меняя историю.",
                            ScenarioDifficulty.INTERMEDIATE,
                            List.of("history", "cleanup", "planning")
                    ),
                    new ScenarioSummary(
                            "remote-sync-preview",
                            "remote-sync-preview",
                            "Проверь удалённое состояние перед pull",
                            "Сравни признаки опережения и отставания и реши, что уместнее перед синхронизацией: fetch или pull.",
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
