package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioTaskContentNotAuthoredException;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ScenarioTaskContentFixtureSource {

    private static final Map<String, ScenarioTaskContentFixture> FIXTURES = Map.of(
            "status-basics", new ScenarioTaskContentFixture(
                    "authored-fixture",
                    "Прочитайте состояние репозитория, прежде чем выбирать первую безопасную Git-команду.",
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(2, "read-short-status", "Посмотрите краткий `status` и отметьте, какие файлы изменены, а какие ещё не отслеживаются."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(1, "check-branch", "Уточните, какая ветка сейчас активна, прежде чем решать, нужно ли вообще переключение."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(3, "protect-worktree", "Избегайте команд, которые меняют историю или выбрасывают работу, пока дерево ещё только проверяется.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(2, "Соберите сигналы рабочего дерева", "Зафиксируйте, какие пути изменены, не отслеживаются или уже проиндексированы, чтобы следующий шаг опирался на факты."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(1, "Определите текущую ветку", "Сначала посмотрите на активную ветку, чтобы не терять ориентацию до предложения любой команды."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(3, "Выберите самый безопасный первый шаг", "Подберите первую Git-команду, которая собирает информацию и не меняет историю репозитория.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(2, "Подсказка по безопасности", "В этом сценарии проверка идёт раньше любых изменений."),
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(1, "Целевой результат", "Нужно обосновать безопасную первую команду, а не сразу переходить к очистке.")
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
                    "Объясните следующую команду для синхронизации после чтения признаков опережения или отставания.",
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(1, "check-tracking", "Посмотрите, как локальная ветка соотносится с отслеживаемой удалённой веткой."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(3, "separate-fetch-from-merge", "Разделяйте решения о `fetch` и `merge`, пока состояние репозитория не стало понятным."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(2, "read-divergence", "Определите, опережает ветка, отстаёт или разошлась, прежде чем выбирать команду синхронизации.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(3, "Выберите команду синхронизации", "Назовите самый безопасный следующий шаг, исходя из того, нужно ли сначала получить новые данные с удалённого репозитория."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(1, "Проверьте связь с отслеживаемой удалённой веткой", "Сначала прочитайте состояние отслеживаемой удалённой ветки и только потом предлагайте `pull` или `fetch`."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(2, "Интерпретируйте опережение и отставание", "Используйте признаки опережения или отставания, чтобы объяснить, нужна ли интеграция прямо сейчас.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(1, "Дисциплина работы с удалённым репозиторием", "Получение информации и интеграция изменений в этом упражнении рассматриваются как разные решения.")
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
