package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioRepositoryContextGateway;
import com.example.gittrainer.scenario.application.ScenarioRepositoryContextNotAuthoredException;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ScenarioRepositoryContextFixtureSource implements ScenarioRepositoryContextGateway {

    private static final Map<String, ScenarioWorkspaceDetail.ScenarioRepositoryContext> FIXTURES = Map.of(
            "status-basics", context(
                    List.of(
                            branch("main", true),
                            branch("docs/review-notes", false)
                    ),
                    List.of(
                            commit("a1c9e31", "docs: добавить черновик заметок по ревью"),
                            commit(
                                    "f72ab44",
                                    "app: удержать оболочку рабочего пространства стабильной"
                            )
                    ),
                    List.of(
                            file("README.md", "modified"),
                            file("notes/status-checklist.md", "untracked"),
                            file("src/main.js", "modified")
                    ),
                    List.of(
                            annotation(
                                    "Подсказка рабочего дерева",
                                    "Два отслеживаемых файла изменены, "
                                            + "а один файл с чеклистом "
                                            + "всё ещё не отслеживается."
                            ),
                            annotation(
                                    "Подсказка для решения",
                                    "В этом сценарии ценится команда проверки "
                                            + "до любого `stage` или очистки."
                            )
                    )
            ),
            "branch-safety", context(
                    List.of(
                            branch("release/hotfix-7", true),
                            branch("feature/menu-refresh", false),
                            branch("main", false)
                    ),
                    List.of(
                            commit("b74e2d0", "hotfix: восстановить отступы заголовка"),
                            commit("197a0f4", "release: отметить чеклист выкладки")
                    ),
                    List.of(
                            file("src/ui/header.css", "modified"),
                            file("docs/release-checklist.md", "modified")
                    ),
                    List.of(
                            annotation(
                                    "Сигнал активной ветки",
                                    "Сейчас активна `release/hotfix-7`, "
                                            + "и оба изменённых файла выглядят "
                                            + "как незавершённая hotfix "
                                            + "или release-работа."
                            ),
                            annotation(
                                    "Почему нельзя переключаться вслепую",
                                    "До явной проверки текущей ветки "
                                            + "и открытых правок любой `checkout` "
                                            + "останется догадкой и может смешать "
                                            + "hotfix с feature-задачей."
                            )
                    )
            ),
            "history-cleanup-preview", context(
                    List.of(
                            branch("feature/history-cleanup", true),
                            branch("main", false)
                    ),
                    List.of(
                            commit("c102d6b", "fixup! ui: переименовать бейдж оболочки"),
                            commit("91fe2ad", "ui: переименовать бейдж оболочки"),
                            commit("43bc8c1", "wip: ещё раз подправить отступы")
                    ),
                    List.of(
                            file("frontend/src/styles.css", "modified"),
                            file("frontend/src/workspace-shell/view.js", "modified")
                    ),
                    List.of(
                            annotation(
                                    "Сигнал для preview истории",
                                    "Верхушка истории уже показывает `fixup!` "
                                            + "рядом с базовым UI-коммитом "
                                            + "и отдельный WIP-коммит, "
                                            + "поэтому сначала нужен "
                                            + "компактный просмотр стека."
                            ),
                            annotation(
                                    "Почему rebase ещё рано",
                                    "Сценарий пока просит только увидеть "
                                            + "кандидатов на очистку "
                                            + "в читаемом виде. "
                                            + "Любой `rebase -i` раньше этого шага "
                                            + "скрывает обязательный preview."
                            )
                    )
            ),
            "remote-sync-preview", context(
                    List.of(
                            branch("main", true),
                            branch("origin/main", false)
                    ),
                    List.of(
                            commit("87d20aa", "docs: уточнить чеклист синхронизации"),
                            commit(
                                    "3fd81e5",
                                    "feat: подготовить баннер статуса удалённого репозитория"
                            )
                    ),
                    List.of(
                            file("docs/sync-playbook.md", "clean"),
                            file("frontend/src/banner.js", "clean")
                    ),
                    List.of(
                            annotation(
                                    "Сигнал устаревшего remote-tracking состояния",
                                    "Локальная `main` уже опережает известный "
                                            + "`origin/main`, но на удалённом "
                                            + "есть ещё не полученные изменения, "
                                            + "поэтому текущая картина divergence "
                                            + "неполная."
                            ),
                            annotation(
                                    "Почему pull ещё рано",
                                    "Пока remote-tracking refs не обновлены, "
                                            + "`pull` смешивает получение новых данных "
                                            + "и интеграцию. "
                                            + "Сначала нужен отдельный `fetch`."
                            )
                    )
            )
    );

    @Override
    public ScenarioWorkspaceDetail.ScenarioRepositoryContext loadRepositoryContext(String scenarioSlug) {
        ScenarioWorkspaceDetail.ScenarioRepositoryContext fixture = FIXTURES.get(scenarioSlug);
        if (fixture == null) {
            throw new ScenarioRepositoryContextNotAuthoredException(scenarioSlug);
        }

        return fixture;
    }

    private static ScenarioWorkspaceDetail.ScenarioRepositoryContext context(
            List<ScenarioWorkspaceDetail.ScenarioRepositoryBranch> branches,
            List<ScenarioWorkspaceDetail.ScenarioRepositoryCommit> commits,
            List<ScenarioWorkspaceDetail.ScenarioRepositoryFile> files,
            List<ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation> annotations
    ) {
        return new ScenarioWorkspaceDetail.ScenarioRepositoryContext(
                "authored-fixture",
                branches,
                commits,
                files,
                annotations
        );
    }

    private static ScenarioWorkspaceDetail.ScenarioRepositoryBranch branch(
            String name,
            boolean current
    ) {
        return new ScenarioWorkspaceDetail.ScenarioRepositoryBranch(name, current);
    }

    private static ScenarioWorkspaceDetail.ScenarioRepositoryCommit commit(
            String id,
            String summary
    ) {
        return new ScenarioWorkspaceDetail.ScenarioRepositoryCommit(id, summary);
    }

    private static ScenarioWorkspaceDetail.ScenarioRepositoryFile file(
            String path,
            String status
    ) {
        return new ScenarioWorkspaceDetail.ScenarioRepositoryFile(path, status);
    }

    private static ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation annotation(
            String label,
            String message
    ) {
        return new ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation(label, message);
    }
}
