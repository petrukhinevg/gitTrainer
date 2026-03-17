package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioRepositoryContextNotAuthoredException;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ScenarioRepositoryContextFixtureSource {

    private static final Map<String, ScenarioWorkspaceDetail.ScenarioRepositoryContext> FIXTURES = Map.of(
            "status-basics", new ScenarioWorkspaceDetail.ScenarioRepositoryContext(
                    "authored-fixture",
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("main", true),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("docs/review-notes", false)
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("a1c9e31", "docs: добавить черновик заметок по ревью"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("f72ab44", "app: удержать оболочку рабочего пространства стабильной")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("README.md", "modified"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("notes/status-checklist.md", "untracked"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("src/main.js", "modified")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Подсказка рабочего дерева", "Два отслеживаемых файла изменены, а один файл с чеклистом всё ещё не отслеживается."),
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Подсказка для решения", "В этом сценарии ценится команда проверки до любого `stage` или очистки.")
                    )
            ),
            "branch-safety", new ScenarioWorkspaceDetail.ScenarioRepositoryContext(
                    "authored-fixture",
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("release/hotfix-7", true),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("feature/menu-refresh", false),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("main", false)
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("b74e2d0", "hotfix: восстановить отступы заголовка"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("197a0f4", "release: отметить чеклист выкладки")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("src/ui/header.css", "modified"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("docs/release-checklist.md", "modified")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Назначение ветки", "Текущая ветка предназначена для hotfix и уже содержит изменения, связанные с релизом."),
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Напряжение задачи", "Нужно решить, относится ли запрошенная работа сюда или должна идти в feature-ветку.")
                    )
            ),
            "history-cleanup-preview", new ScenarioWorkspaceDetail.ScenarioRepositoryContext(
                    "authored-fixture",
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("feature/history-cleanup", true),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("main", false)
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("c102d6b", "fixup! ui: переименовать бейдж оболочки"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("91fe2ad", "ui: переименовать бейдж оболочки"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("43bc8c1", "wip: ещё раз подправить отступы")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("frontend/src/styles.css", "modified"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("frontend/src/workspace-shell/view.js", "modified")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Подсказка по истории", "Среди последних коммитов есть `fixup` и лишнее WIP-изменение, что намекает на будущую очистку."),
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Подсказка по безопасности", "Пользователь всё ещё находится в режиме планирования и не должен переписывать историю.")
                    )
            ),
            "remote-sync-preview", new ScenarioWorkspaceDetail.ScenarioRepositoryContext(
                    "authored-fixture",
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("main", true),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryBranch("origin/main", false)
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("87d20aa", "docs: уточнить чеклист синхронизации"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryCommit("3fd81e5", "feat: подготовить баннер статуса remote")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("docs/sync-playbook.md", "clean"),
                            new ScenarioWorkspaceDetail.ScenarioRepositoryFile("frontend/src/banner.js", "clean")
                    ),
                    List.of(
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Подсказка по remote", "Локальная `main` опережает на один коммит, а в `origin/main` есть ещё не полученные удалённые изменения."),
                            new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation("Подсказка для решения", "Нужно решить, стоит ли сначала выполнить `fetch`, прежде чем выбирать интегрирующую команду.")
                    )
            )
    );

    public ScenarioWorkspaceDetail.ScenarioRepositoryContext fixtureFor(String scenarioSlug) {
        ScenarioWorkspaceDetail.ScenarioRepositoryContext fixture = FIXTURES.get(scenarioSlug);
        if (fixture == null) {
            throw new ScenarioRepositoryContextNotAuthoredException(scenarioSlug);
        }

        return fixture;
    }
}
