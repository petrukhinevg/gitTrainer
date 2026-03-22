package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioTaskContent;
import com.example.gittrainer.scenario.application.ScenarioTaskContentGateway;
import com.example.gittrainer.scenario.application.ScenarioTaskContentNotAuthoredException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ScenarioTaskContentFixtureSource implements ScenarioTaskContentGateway {

    private static final Map<String, ScenarioTaskContent> FIXTURES = Map.of(
            "status-basics", fixture(
                    "Сначала проверьте состояние рабочего дерева "
                            + "и только после этого выбирайте следующий шаг.",
                    List.of(
                            instruction(
                                    2,
                                    "confirm-short-status-signals",
                                    "Сверьте краткий `git status --short` "
                                            + "и зафиксируйте, какие файлы изменены, "
                                            + "а какие ещё не отслеживаются."
                            ),
                            instruction(
                                    1,
                                    "inspect-working-tree-first",
                                    "Начните с команды проверки состояния, "
                                            + "а не с переключения ветки "
                                            + "или изменения файлов."
                            ),
                            instruction(
                                    3,
                                    "avoid-mutation-commands",
                                    "Избегайте команд, которые меняют историю "
                                            + "или рабочее дерево, пока не подтверждён "
                                            + "безопасный шаг проверки."
                            )
                    ),
                    List.of(
                            step(
                                    2,
                                    "Сверьте сигналы short-статуса",
                                    "Подтвердите по `git status --short`, "
                                            + "какие пути изменены и какие "
                                            + "остаются неотслеживаемыми."
                            ),
                            step(
                                    1,
                                    "Начните с проверки рабочего дерева",
                                    "Первая команда должна только читать состояние "
                                            + "репозитория и ничего не менять."
                            ),
                            step(
                                    3,
                                    "Зафиксируйте безопасный первый шаг",
                                    "Для этого сценария ожидается команда "
                                            + "из семейства `git status` "
                                            + "как честный следующий шаг."
                            ),
                            step(
                                    4,
                                    "Добавьте тестовую проверку формулировки",
                                    "Дополнительный шаг нужен для проверки "
                                            + "более длинного списка подзадач "
                                            + "в левой колонке."
                            ),
                            step(
                                    5,
                                    "Оставьте финал без изменения состояния",
                                    "Даже тестовое продолжение списка должно "
                                            + "оставаться в режиме чтения "
                                            + "репозитория."
                            )
                    ),
                    List.of(
                            annotation(
                                    2,
                                    "Подсказка по проверке",
                                    "Здесь оценивается команда проверки состояния "
                                            + "(`git status`), "
                                            + "а не команда изменения."
                            ),
                            annotation(
                                    1,
                                    "Целевой результат",
                                    "Нужно показать безопасную проверку "
                                            + "рабочего дерева до любого stage, "
                                            + "checkout или очистки."
                            )
                    )
            ),
            "branch-safety", fixture(
                    "Сначала подтвердите активную ветку и признаки "
                            + "незавершённой hotfix-работы, "
                            + "а уже потом решайте, допустимо ли переключение.",
                    List.of(
                            instruction(
                                    1,
                                    "confirm-active-branch-before-switching",
                                    "Сначала подтвердите активную ветку "
                                            + "командой чтения, "
                                            + "а не пытайтесь сразу выполнить `checkout`."
                            ),
                            instruction(
                                    2,
                                    "connect-open-edits-to-branch-purpose",
                                    "Свяжите имя ветки и уже изменённые файлы "
                                            + "с hotfix или release-контекстом, "
                                            + "чтобы понять, почему решение "
                                            + "о переключении ещё рано."
                            ),
                            instruction(
                                    3,
                                    "keep-next-step-observable",
                                    "Следующий шаг должен прояснить "
                                            + "branch-контекст, "
                                            + "но не менять состояние репозитория."
                            )
                    ),
                    List.of(
                            step(
                                    1,
                                    "Подтвердите текущую ветку",
                                    "Начните с команды чтения branch-контекста, "
                                            + "чтобы точно увидеть, "
                                            + "где уже открыта работа."
                            ),
                            step(
                                    2,
                                    "Сопоставьте ветку с незавершёнными правками",
                                    "Используйте имя ветки и изменённые файлы "
                                            + "как подсказку, почему сценарий "
                                            + "пока не просит немедленный `checkout`."
                            ),
                            step(
                                    3,
                                    "Отложите переключение до подтверждения контекста",
                                    "Сначала зафиксируйте безопасный branch-reading "
                                            + "шаг, после которого решение "
                                            + "о переключении можно будет обосновать."
                            ),
                            step(
                                    4,
                                    "Добавьте тестовый комментарий к выбору",
                                    "Этот шаг расширяет серверный fixture-список "
                                            + "для проверки UI и не добавляет "
                                            + "новой смысловой развилки."
                            )
                    ),
                    List.of(
                            annotation(
                                    1,
                                    "Что считается безопасным шагом",
                                    "Пока в hotfix-ветке уже есть незавершённые "
                                            + "изменения, сценарий оценивает "
                                            + "команду чтения branch-контекста, "
                                            + "а не автоматический `checkout`."
                            ),
                            annotation(
                                    2,
                                    "Граница решения",
                                    "Переключение ветки обсуждается только после того, "
                                            + "как UI-контекст подтвердил текущую ветку "
                                            + "и характер открытых правок."
                            )
                    )
            ),
            "history-cleanup-preview", fixture(
                    "Сначала просмотрите недавний граф коммитов с `fixup!` "
                            + "и WIP-сигналами, "
                            + "а уже потом формулируйте план очистки "
                            + "без переписывания истории.",
                    List.of(
                            instruction(
                                    1,
                                    "preview-commit-graph-before-rewrite",
                                    "Начните с команды чтения истории, "
                                            + "а не с `rebase -i`, "
                                            + "чтобы сначала увидеть "
                                            + "стек проблемных коммитов."
                            ),
                            instruction(
                                    2,
                                    "use-fixup-and-wip-as-cues",
                                    "Используйте `fixup!` и отдельный WIP-коммит "
                                            + "как наблюдаемые сигналы того, "
                                            + "какие части истории вообще "
                                            + "нужно включить в cleanup."
                            ),
                            instruction(
                                    3,
                                    "keep-next-step-in-preview-mode",
                                    "Следующий шаг должен показать компактный "
                                            + "preview истории, "
                                            + "но не менять коммиты."
                            )
                    ),
                    List.of(
                            step(
                                    1,
                                    "Просмотрите верхушку истории",
                                    "Сначала покажите недавний стек коммитов "
                                            + "в компактном виде, "
                                            + "чтобы увидеть форму будущей очистки."
                            ),
                            step(
                                    2,
                                    "Выделите кандидатов на cleanup",
                                    "Используйте `fixup!` и WIP как признаки того, "
                                            + "какие коммиты стоит обсуждать "
                                            + "в плане очистки."
                            ),
                            step(
                                    3,
                                    "Оставьте переписывание на потом",
                                    "Зафиксируйте безопасный preview-шаг, "
                                            + "после которого interactive rebase "
                                            + "можно будет обосновать, "
                                            + "но ещё не выполнять."
                            ),
                            step(
                                    4,
                                    "Оставьте ещё один тестовый ориентир",
                                    "Дополнительная подзадача нужна только "
                                            + "для проверки длинного раскрытого "
                                            + "списка в навигации."
                            ),
                            step(
                                    5,
                                    "Завершите план условным черновиком",
                                    "Финальный пункт остаётся тестовым и нужен, "
                                            + "чтобы структура authored-сценария "
                                            + "выглядела плотнее."
                            )
                    ),
                    List.of(
                            annotation(
                                    1,
                                    "Что считается безопасным шагом",
                                    "В этом preview-сценарии оценивается "
                                            + "компактная команда из семейства "
                                            + "`git log`, а не `rebase`, "
                                            + "`commit --amend` или `reset`."
                            ),
                            annotation(
                                    2,
                                    "Граница сценария",
                                    "Задача заканчивается на наблюдаемом preview "
                                            + "истории, после которого план cleanup "
                                            + "уже можно обсуждать предметно."
                            )
                    )
            ),
            "remote-sync-preview", fixture(
                    "Сначала обновите remote-tracking состояние отдельным `fetch`, "
                            + "а уже потом решайте, нужен ли `pull` "
                            + "или другая интеграция.",
                    List.of(
                            instruction(
                                    1,
                                    "refresh-remote-state-before-integration",
                                    "Начните с отдельного получения новых remote refs, "
                                            + "а не с `pull`, чтобы сначала обновить "
                                            + "наблюдаемое состояние."
                            ),
                            instruction(
                                    2,
                                    "treat-local-ahead-and-remote-behind-as-incomplete-view",
                                    "Считайте текущие признаки опережения "
                                            + "и отставания неполными, "
                                            + "пока `origin/main` не обновлён "
                                            + "через `fetch`."
                            ),
                            instruction(
                                    3,
                                    "keep-next-step-in-preview-mode",
                                    "Следующий шаг должен принести новые данные "
                                            + "с удалённого репозитория, "
                                            + "но ещё не выполнять merge или rebase."
                            )
                    ),
                    List.of(
                            step(
                                    1,
                                    "Обновите удалённые refs",
                                    "Сначала выполните безопасный шаг получения "
                                            + "новых данных об удалённой ветке "
                                            + "без интеграции в локальную историю."
                            ),
                            step(
                                    2,
                                    "Отделите получение данных от интеграции",
                                    "Используйте текущие сигналы divergence "
                                            + "как аргумент в пользу `fetch`, "
                                            + "а не немедленного `pull`."
                            ),
                            step(
                                    3,
                                    "Оставьте merge или rebase на потом",
                                    "После отдельного `fetch` уже можно будет "
                                            + "решать, нужна ли интеграция, "
                                            + "но этот сценарий останавливается раньше."
                            ),
                            step(
                                    4,
                                    "Проверьте тестовый пост-скрипт решения",
                                    "Этот шаг добавлен для проверки более "
                                            + "длинных веток навигации в серверном режиме."
                            )
                    ),
                    List.of(
                            annotation(
                                    1,
                                    "Что считается безопасным шагом",
                                    "В этом preview-сценарии оценивается команда "
                                            + "из семейства `git fetch`, "
                                            + "а не `pull`, `merge` или `rebase`."
                            ),
                            annotation(
                                    2,
                                    "Граница сценария",
                                    "Задача заканчивается после обновления "
                                            + "remote-tracking состояния "
                                            + "и не выполняет интеграцию "
                                            + "удалённых коммитов в локальную ветку."
                            )
                    )
            ),
            "stash-checkpoint-draft", fixture(
                    "Проверьте, что новый тестовый родитель отображается "
                            + "и раскрывается так же, как остальные "
                            + "authored-сценарии.",
                    List.of(
                            instruction(
                                    1,
                                    "read-placeholder-context",
                                    "Прочитайте тестовый контекст и убедитесь, "
                                            + "что блок ведёт себя как обычный "
                                            + "authored fixture."
                            ),
                            instruction(
                                    2,
                                    "keep-sandbox-tone",
                                    "Текст может быть условным, но структура "
                                            + "должна оставаться такой же, "
                                            + "как у остальных сценариев."
                            ),
                            instruction(
                                    3,
                                    "preserve-subtask-shape",
                                    "Каждая дочерняя задача нужна для проверки "
                                            + "раскрытия и переходов по focus."
                            )
                    ),
                    List.of(
                            step(
                                    1,
                                    "Прочитайте тестовое описание",
                                    "Первый шаг нужен для проверки общего "
                                            + "шаблона контента и не требует "
                                            + "глубокой предметной нагрузки."
                            ),
                            step(
                                    2,
                                    "Откройте дочерние пункты в навигации",
                                    "Этот пункт нужен, чтобы у нового родителя "
                                            + "было несколько focus-ссылок, "
                                            + "как у существующих блоков."
                            ),
                            step(
                                    3,
                                    "Сверьте нейтральную команду",
                                    "Для серверного fixture-режима здесь "
                                            + "достаточно безопасной тестовой "
                                            + "команды из семейства `git stash`."
                            )
                    ),
                    List.of(
                            annotation(
                                    1,
                                    "Тестовое назначение",
                                    "Сценарий добавлен только для проверки UI "
                                            + "и authored-flow без строгой "
                                            + "предметной нагрузки."
                            )
                    )
            ),
            "merge-sandbox-outline", fixture(
                    "Добавьте ещё один родительский блок со средней длиной "
                            + "списка шагов и привычным устройством данных.",
                    List.of(
                            instruction(
                                    1,
                                    "inspect-merge-shape",
                                    "Сначала считайте fixture-контекст и не "
                                            + "пытайтесь превращать этот блок "
                                            + "в полноценный merge-тренажёр."
                            ),
                            instruction(
                                    2,
                                    "stay-in-preview-mode",
                                    "Как и в других preview-сценариях, "
                                            + "здесь достаточно безопасного "
                                            + "шага чтения и общего плана."
                            ),
                            instruction(
                                    3,
                                    "use-test-copy",
                                    "Текст оставлен нейтральным специально, "
                                            + "чтобы его можно было использовать "
                                            + "для визуального тестирования."
                            )
                    ),
                    List.of(
                            step(
                                    1,
                                    "Соберите тестовый контекст веток",
                                    "Первый шаг нужен для одинаковой структуры: "
                                            + "у сценария есть обзор "
                                            + "и несколько дочерних задач."
                            ),
                            step(
                                    2,
                                    "Посмотрите на форму истории",
                                    "Этот шаг имитирует чтение графа коммитов "
                                            + "и даёт ещё одну точку перехода "
                                            + "в сайдбаре."
                            ),
                            step(
                                    3,
                                    "Выберите нейтральный следующий шаг",
                                    "Для локальной и серверной проверки здесь "
                                            + "достаточно безвредной команды "
                                            + "чтения истории."
                            ),
                            step(
                                    4,
                                    "Оставьте запасной тестовый шаг",
                                    "Дополнительный пункт нужен только для "
                                            + "проверки длинной раскрытой группы "
                                            + "и анимации списка."
                            )
                    ),
                    List.of(
                            annotation(
                                    1,
                                    "Назначение блока",
                                    "Этот сценарий расширяет тестовую карту "
                                            + "и повторяет устройство существующих "
                                            + "authored fixtures."
                            )
                    )
            ),
            "tag-checkpoint-preview", fixture(
                    "Проверьте ещё один короткий authored-сценарий с двумя-тремя "
                            + "шагами, чтобы лента родителей стала длиннее.",
                    List.of(
                            instruction(
                                    1,
                                    "inspect-tag-list",
                                    "Посмотрите на список ориентиров и убедитесь, "
                                            + "что UI корректно обрабатывает "
                                            + "дополнительный authored-сценарий."
                            ),
                            instruction(
                                    2,
                                    "keep-copy-light",
                                    "Здесь допустим нейтральный тестовый текст, "
                                            + "если структура поля и секций "
                                            + "совпадает с остальными сценариями."
                            ),
                            instruction(
                                    3,
                                    "prefer-read-only-command",
                                    "Следующий шаг всё так же должен быть "
                                            + "безопасным и не менять историю."
                            )
                    ),
                    List.of(
                            step(
                                    1,
                                    "Откройте список тестовых ориентиров",
                                    "Первая подзадача существует для структуры "
                                            + "и не требует содержательного решения."
                            ),
                            step(
                                    2,
                                    "Сверьте условный тег с описанием",
                                    "Этот шаг добавляет ещё одну focus-ссылку "
                                            + "и помогает проверить переходы "
                                            + "между соседними родителями."
                            ),
                            step(
                                    3,
                                    "Назовите безопасную команду просмотра",
                                    "Для серверного fixture-режима здесь "
                                            + "достаточно команды чтения вроде "
                                            + "`git tag --list`."
                            )
                    ),
                    List.of(
                            annotation(
                                    1,
                                    "Fixture-нагрузка",
                                    "Сценарий добавлен для тестирования длины "
                                            + "маршрута и поведения левой колонки."
                            )
                    )
            )
    );

    @Override
    public ScenarioTaskContent loadTaskContent(String scenarioSlug) {
        ScenarioTaskContent fixture = FIXTURES.get(scenarioSlug);
        if (fixture == null) {
            throw new ScenarioTaskContentNotAuthoredException(scenarioSlug);
        }

        return fixture;
    }

    private static ScenarioTaskContent fixture(
            String goal,
            List<ScenarioTaskContent.ScenarioTaskInstruction> instructions,
            List<ScenarioTaskContent.ScenarioTaskStep> steps,
            List<ScenarioTaskContent.ScenarioTaskAnnotation> annotations
    ) {
        return new ScenarioTaskContent("authored-fixture", goal, instructions, steps, annotations);
    }

    private static ScenarioTaskContent.ScenarioTaskInstruction instruction(
            int position,
            String id,
            String text
    ) {
        return new ScenarioTaskContent.ScenarioTaskInstruction(position, id, text);
    }

    private static ScenarioTaskContent.ScenarioTaskStep step(
            int position,
            String title,
            String detail
    ) {
        return new ScenarioTaskContent.ScenarioTaskStep(position, title, detail);
    }

    private static ScenarioTaskContent.ScenarioTaskAnnotation annotation(
            int position,
            String label,
            String message
    ) {
        return new ScenarioTaskContent.ScenarioTaskAnnotation(position, label, message);
    }
}
