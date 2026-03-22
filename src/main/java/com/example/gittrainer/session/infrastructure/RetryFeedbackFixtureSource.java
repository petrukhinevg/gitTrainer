package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.RetryExplanationTemplate;
import com.example.gittrainer.session.application.RetryHintTemplate;
import com.example.gittrainer.session.domain.RetryGuidanceProfile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class RetryFeedbackFixtureSource {

    private static final Map<String, RetryGuidanceProfile> SCENARIO_PROFILES = Map.of(
            "status-basics",
            new RetryGuidanceProfile(
                    "inspection-command-should-come-before-mutation",
                    "inspect-working-tree-before-acting",
                    "working-tree-inspection"
            ),
            "branch-safety",
            new RetryGuidanceProfile(
                    "branch-choice-needs-task-alignment",
                    "compare-branch-purpose-before-switching",
                    "branch-intent"
            ),
            "history-cleanup-preview",
            new RetryGuidanceProfile(
                    "history-cleanup-requires-plan-first",
                    "plan-history-cleanup-before-rewriting",
                    "history-plan"
            ),
            "remote-sync-preview",
            new RetryGuidanceProfile(
                    "remote-sync-requires-fetch-first",
                    "refresh-remote-state-before-integration",
                    "remote-fetch"
            )
    );

    private static final Map<String, RetryExplanationTemplate> EXPLANATION_TEMPLATES = Map.of(
            "partial-answer-needs-refinement",
            new RetryExplanationTemplate(
                    "Вы смотрите в правильную область, но команду ещё нужно уточнить",
                    "partial",
                    "`{{submittedAnswer}}` указывает на правильный сигнал репозитория, "
                            + "но задаче всё ещё нужна более точная команда проверки, "
                            + "прежде чем ответ станет правильным.",
                    List.of(
                            "Пользователь уже стартовал из правильного семейства команд проверки, "
                                    + "поэтому сообщение о повторе должно поддержать это направление, "
                                    + "а не считать ответ полным промахом.",
                            "Следующая подсказка может сузить форму команды, "
                                    + "не меняя саму панель обратной связи."
                    )
            ),
            "unsupported-answer-type",
            new RetryExplanationTemplate(
                    "Вернитесь к поддерживаемому вводу команды",
                    "unsupported",
                    "Сейчас проверяются только ответы в виде команды, "
                            + "поэтому перед следующей попыткой нужно вернуть поддерживаемый формат.",
                    List.of(
                            "Запрос принимается, но такой тип ответа всё ещё считается неподдерживаемым.",
                            "Панель повтора должна сначала вернуть пользователя к поддерживаемому "
                                    + "командному формату, а уже потом пробовать более богатые варианты ответа."
                    )
            ),
            "branch-choice-needs-task-alignment",
            new RetryExplanationTemplate(
                    "Подтвердите текущую ветку до решения о переключении",
                    "incorrect",
                    "В этом сценарии безопасный следующий шаг — сначала прочитать активную ветку "
                            + "или branch-aware status, потому что репозиторий уже содержит "
                            + "незавершённые hotfix-изменения. Переключение прямо сейчас оставалось бы догадкой.",
                    List.of(
                            "Сценарий пока не просит выполнять `checkout`. "
                                    + "Сначала он требует собрать минимальный branch cue "
                                    + "и подтвердить, где уже открыта работа.",
                            "После такой проверки пользователь сможет аргументированно решить, "
                                    + "допустимо ли переключение, не смешивая hotfix и feature-контекст."
                    )
            ),
            "history-cleanup-requires-plan-first",
            new RetryExplanationTemplate(
                    "Сначала просмотрите историю, потом переписывайте коммиты",
                    "incorrect",
                    "В этом сценарии следующий безопасный шаг — сначала показать недавний стек "
                            + "истории в читаемом виде, потому что `fixup!` и WIP-сигналы "
                            + "ещё нужно явно увидеть до любого `rebase`.",
                    List.of(
                            "Правильная следующая попытка остаётся в семействе `git log` "
                                    + "и помогает увидеть, какие коммиты вообще войдут в cleanup.",
                            "Только после такого preview можно аргументированно обсуждать "
                                    + "interactive rebase или другую команду переписывания."
                    )
            ),
            "inspection-command-should-come-before-mutation",
            new RetryExplanationTemplate(
                    "Проверьте рабочее дерево до любых изменений",
                    "incorrect",
                    "Безопасное следующее действие в этом сценарии — сначала проверить "
                            + "состояние репозитория, а не сразу переходить к изменяющей команде.",
                    List.of(
                            "Это упражнение про чтение текущего состояния до действия, "
                                    + "а не про выбор целевой ветки или изменение файлов.",
                            "Панель повтора должна удерживать пользователя в цикле проверки, "
                                    + "пока форма правильной команды не станет очевидной."
                    )
            ),
            "remote-sync-requires-fetch-first",
            new RetryExplanationTemplate(
                    "Сначала обновите удалённое состояние, потом интегрируйте",
                    "incorrect",
                    "В этом сценарии безопасный следующий шаг — отдельно получить новые remote refs, "
                            + "потому что без свежего `fetch` решение о `pull` "
                            + "или другой интеграции остаётся преждевременным.",
                    List.of(
                            "Правильная следующая попытка должна оставаться в семействе `git fetch` "
                                    + "и обновить наблюдаемое состояние `origin/main` без слияния.",
                            "Только после такого preview можно предметно решать, нужен ли `pull`, "
                                    + "`merge` или `rebase`."
                    )
            ),
            "retry-guidance-needs-scenario-review",
            new RetryExplanationTemplate(
                    "Вернитесь к цели сценария перед следующей попыткой",
                    "incorrect",
                    "Цикл повтора должен вернуть пользователя к цели сценария, "
                            + "а затем сузить следующую попытку самым маленьким "
                            + "доступным безопасным намёком.",
                    List.of(
                            "Когда сценарно-специфичная подсказка недоступна, "
                                    + "объяснение должно оставаться сфокусированным на цели задачи, "
                                    + "а не изобретать новые правила.",
                            "Следующая подсказка всё ещё может сузить путь повтора, "
                                    + "не затрагивая слой policy."
                    )
            )
    );

    private static final Map<String, RetryHintTemplate> HINT_TEMPLATES = Map.of(
            "partial-answer",
            new RetryHintTemplate(
                    "Останьтесь в том же семействе проверок",
                    "Оставайтесь в той же зоне проверки, но уберите лишний охват "
                            + "или переключитесь на каноничную безопасную команду для сценария.",
                    "Сверьтесь с точным безопасным шагом",
                    "Ищите самую маленькую команду, которая проверяет именно то состояние репозитория, "
                            + "о котором спрашивает задача, без лишнего намерения."
            ),
            "unsupported-answer-type",
            new RetryHintTemplate(
                    "Используйте режим текста команды",
                    "Переключите тип ответа обратно на текст команды и оставьте "
                            + "следующую попытку в форме простой команды проверки.",
                    "Ориентируйтесь на поддерживаемый пример",
                    "Посмотрите на бейдж поддерживаемого типа ответа над формой "
                            + "и сначала вернитесь к этому режиму."
            ),
            "branch-intent",
            new RetryHintTemplate(
                    "Сначала подтвердите активную ветку",
                    "Выберите branch-reading шаг, который ничего не меняет в репозитории, "
                            + "но явно показывает, где сейчас открыта работа.",
                    "Выберите команду чтения branch-контекста",
                    "Нужна самая маленькая команда из семейства `git branch --show-current` "
                            + "или branch-aware `git status`, которая подтверждает текущую ветку "
                            + "до любых решений о `checkout`."
            ),
            "history-plan",
            new RetryHintTemplate(
                    "Сначала покажите компактную историю",
                    "Оставайтесь в preview-режиме и выберите команду, которая показывает "
                            + "верхушку истории с `fixup!` и WIP, не меняя коммиты.",
                    "Выберите команду просмотра графа истории",
                    "Нужна компактная команда из семейства `git log --oneline --decorate`; "
                            + "вариант с `--graph` тоже подходит, если делает стек читаемее."
            ),
            "working-tree-inspection",
            new RetryHintTemplate(
                    "Начните с проверки рабочего дерева",
                    "Сценарий спрашивает о состоянии репозитория, поэтому следующая попытка "
                            + "должна оставаться в семействе `git status`, "
                            + "а не менять файлы или ветки.",
                    "Используйте `git status` как безопасный первый шаг",
                    "Сначала отправьте `git status` или `git status --short`, "
                            + "чтобы подтвердить изменённые и неотслеживаемые файлы "
                            + "до любого следующего действия."
            ),
            "remote-fetch",
            new RetryHintTemplate(
                    "Сначала получите свежие remote refs",
                    "Выберите отдельный шаг получения данных с удалённого репозитория, "
                            + "который обновляет картину `origin/main`, "
                            + "но не интегрирует изменения в локальную ветку.",
                    "Выберите команду из семейства `git fetch`",
                    "Нужна команда вроде `git fetch` или `git fetch origin`, "
                            + "а не `pull`, потому что сценарий сначала оценивает "
                            + "обновление remote-tracking состояния."
            ),
            "generic-retry",
            new RetryHintTemplate(
                    "Вернитесь к цели сценария",
                    "Переформулируйте задачу в одном предложении и держите "
                            + "следующую попытку сфокусированной на самой маленькой безопасной команде, "
                            + "которая на неё отвечает.",
                    "Покажите самый маленький безопасный следующий шаг",
                    "Уберите лишнее намерение и выберите команду, "
                            + "которая даёт недостающий сигнал до любого более крупного действия."
            )
    );

    public Optional<RetryGuidanceProfile> findIncorrectGuidance(String scenarioSlug) {
        return Optional.ofNullable(SCENARIO_PROFILES.get(scenarioSlug));
    }

    public Optional<RetryExplanationTemplate> findExplanationTemplate(String code) {
        return Optional.ofNullable(EXPLANATION_TEMPLATES.get(code));
    }

    public Optional<RetryHintTemplate> findHintTemplate(String templateCode) {
        return Optional.ofNullable(HINT_TEMPLATES.get(templateCode));
    }

    public Map<String, RetryGuidanceProfile> incorrectGuidanceProfiles() {
        return SCENARIO_PROFILES;
    }

    public Map<String, RetryExplanationTemplate> explanationTemplates() {
        return EXPLANATION_TEMPLATES;
    }

    public Map<String, RetryHintTemplate> hintTemplates() {
        return HINT_TEMPLATES;
    }
}
