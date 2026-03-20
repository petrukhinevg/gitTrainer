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
                    "Сначала подтвердите активную ветку и признаки незавершённой hotfix-работы, а уже потом решайте, допустимо ли переключение.",
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(1, "confirm-active-branch-before-switching", "Сначала подтвердите активную ветку командой чтения, а не пытайтесь сразу выполнить `checkout`."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(2, "connect-open-edits-to-branch-purpose", "Свяжите имя ветки и уже изменённые файлы с hotfix или release-контекстом, чтобы понять, почему решение о переключении ещё рано."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(3, "keep-next-step-observable", "Следующий шаг должен прояснить branch-контекст, но не менять состояние репозитория.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(1, "Подтвердите текущую ветку", "Начните с команды чтения branch-контекста, чтобы точно увидеть, где уже открыта работа."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(2, "Сопоставьте ветку с незавершёнными правками", "Используйте имя ветки и изменённые файлы как подсказку, почему сценарий пока не просит немедленный `checkout`."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(3, "Отложите переключение до подтверждения контекста", "Сначала зафиксируйте безопасный branch-reading шаг, после которого решение о переключении можно будет обосновать.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(1, "Что считается безопасным шагом", "Пока в hotfix-ветке уже есть незавершённые изменения, сценарий оценивает команду чтения branch-контекста, а не автоматический `checkout`."),
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(2, "Граница решения", "Переключение ветки обсуждается только после того, как UI-контекст подтвердил текущую ветку и характер открытых правок.")
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
