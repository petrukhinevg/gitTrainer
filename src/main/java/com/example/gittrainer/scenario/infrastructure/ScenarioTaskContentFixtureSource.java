package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioTaskContentNotAuthoredException;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ScenarioTaskContentFixtureSource {

    private static final Map<String, ScenarioTaskContentFixture> FIXTURES = Map.of(
            "status-basics", new ScenarioTaskContentFixture(
                    "authored-fixture",
                    "Сначала проверьте состояние рабочего дерева и только после этого выбирайте следующий шаг.",
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(2, "confirm-short-status-signals", "Сверьте краткий `git status --short` и зафиксируйте, какие файлы изменены, а какие ещё не отслеживаются."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(1, "inspect-working-tree-first", "Начните с команды проверки состояния, а не с переключения ветки или изменения файлов."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(3, "avoid-mutation-commands", "Избегайте команд, которые меняют историю или рабочее дерево, пока не подтверждён безопасный шаг проверки.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(2, "Сверьте сигналы short-статуса", "Подтвердите по `git status --short`, какие пути изменены и какие остаются неотслеживаемыми."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(1, "Начните с проверки рабочего дерева", "Первая команда должна только читать состояние репозитория и ничего не менять."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(3, "Зафиксируйте безопасный первый шаг", "Для этого сценария ожидается команда из семейства `git status` как честный следующий шаг.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(2, "Подсказка по проверке", "Здесь оценивается команда проверки состояния (`git status`), а не команда изменения."),
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(1, "Целевой результат", "Нужно показать безопасную проверку рабочего дерева до любого stage, checkout или очистки.")
                    )
            ),
            "branch-safety", new ScenarioTaskContentFixture(
                    "authored-fixture",
                    "Решите, продолжать ли задачу на текущей ветке или после переключения.",
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(1, "read-current-branch", "Посмотрите на текущую ветку до любых правок файлов или индексации."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(2, "compare-task-intent", "Сопоставьте назначение ветки с задачей, чтобы обосновать, оставаться ли на месте или переключаться."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(3, "avoid-implicit-switch", "Не считайте переключение ветки правильным, пока состояние репозитория и цель задачи не совпадут.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(2, "Сопоставьте ветку и задачу", "Свяжите имя текущей ветки с описанием задачи, прежде чем предлагать `checkout`."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(1, "Поймите, где вы находитесь", "Начните с активной ветки и сигналов того, что рабочее дерево уже используется."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(3, "Сформулируйте решение по ветке", "Кратко объясните, нужно ли остаться на ветке или переключиться и почему это безопаснее.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(1, "Граница решения", "Навигация по веткам должна быть осознанной и объяснённой, а не автоматической.")
                    )
            ),
            "history-cleanup-preview", new ScenarioTaskContentFixture(
                    "authored-fixture",
                    "Подготовьте последовательный план очистки, пока ещё не переписывая историю.",
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(1, "inspect-commit-stack", "Посмотрите на недавний стек коммитов и найдите повторяющиеся или неаккуратные изменения."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(2, "plan-before-rewrite", "Опишите последовательность очистки до выбора любой команды переписывания истории."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(3, "keep-remote-risk-visible", "Учитывайте, могли ли переписываемые коммиты уже быть опубликованы другим.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(2, "Сгруппируйте цели очистки", "Разделите кандидатов на `fixup`, кандидатов на перестановку и коммиты, которые трогать не нужно."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(1, "Прочитайте стек сверху вниз", "Сначала пройдитесь по текущей истории по порядку и только потом предлагайте план очистки."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(3, "Назовите безопасный следующий шаг", "Выберите команду планирования или проверки, которая должна идти до любого переписывания.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(1, "Режим планирования", "Эта задача заканчивается на качестве плана и не выполняет переписывание.")
                    )
            ),
            "remote-sync-preview", new ScenarioTaskContentFixture(
                    "authored-fixture",
                    "Сначала обновите remote-tracking состояние отдельным `fetch`, а уже потом решайте, нужен ли `pull` или другая интеграция.",
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(1, "refresh-remote-state-before-integration", "Начните с отдельного получения новых remote refs, а не с `pull`, чтобы сначала обновить наблюдаемое состояние."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(2, "treat-local-ahead-and-remote-behind-as-incomplete-view", "Считайте текущие признаки опережения и отставания неполными, пока `origin/main` не обновлён через `fetch`."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(3, "keep-next-step-in-preview-mode", "Следующий шаг должен принести новые данные с удалённого репозитория, но ещё не выполнять merge или rebase.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(1, "Обновите удалённые refs", "Сначала выполните безопасный шаг получения новых данных об удалённой ветке без интеграции в локальную историю."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(2, "Отделите получение данных от интеграции", "Используйте текущие сигналы divergence как аргумент в пользу `fetch`, а не немедленного `pull`."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(3, "Оставьте merge или rebase на потом", "После отдельного `fetch` уже можно будет решать, нужна ли интеграция, но этот сценарий останавливается раньше.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(1, "Что считается безопасным шагом", "В этом preview-сценарии оценивается команда из семейства `git fetch`, а не `pull`, `merge` или `rebase`."),
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(2, "Граница сценария", "Задача заканчивается после обновления remote-tracking состояния и не выполняет интеграцию удалённых коммитов в локальную ветку.")
                    )
            )
    );

    public ScenarioTaskContentFixture fixtureFor(String scenarioSlug) {
        ScenarioTaskContentFixture fixture = FIXTURES.get(scenarioSlug);
        if (fixture == null) {
            throw new ScenarioTaskContentNotAuthoredException(scenarioSlug);
        }

        return fixture;
    }
}
