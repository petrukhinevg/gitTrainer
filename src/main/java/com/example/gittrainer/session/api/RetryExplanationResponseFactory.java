package com.example.gittrainer.session.api;

import com.example.gittrainer.session.domain.RetryExplanationSelection;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
class RetryExplanationResponseFactory {

    RetryExplanationResponse placeholderResponse() {
        return new RetryExplanationResponse(
                "placeholder",
                "Подсказка для повтора",
                "neutral",
                "Подсказка для повтора появится здесь после первой проверенной отправки.",
                List.of()
        );
    }

    RetryExplanationResponse resolvedResponse() {
        return new RetryExplanationResponse(
                "resolved",
                "Повторное объяснение не требуется",
                "success",
                "Эта попытка уже привела к безопасному следующему шагу, "
                        + "поэтому панель повтора остаётся спокойной.",
                List.of()
        );
    }

    RetryExplanationResponse guidedResponse(
            RetryExplanationSelection explanationSelection,
            String submittedAnswer
    ) {
        RetryExplanationNarrative narrative = explanationNarrative(explanationSelection, submittedAnswer);
        return new RetryExplanationResponse(
                "guided",
                narrative.title(),
                narrative.tone(),
                narrative.message(),
                narrative.details()
        );
    }

    private RetryExplanationNarrative explanationNarrative(
            RetryExplanationSelection explanationSelection,
            String submittedAnswer
    ) {
        String normalizedAnswer = normalizeSubmittedAnswer(submittedAnswer);
        String code = explanationSelection == null ? "" : explanationSelection.code();

        return switch (code) {
            case "partial-answer-needs-refinement" -> new RetryExplanationNarrative(
                    "Вы смотрите в правильную область, но команду ещё нужно уточнить",
                    "partial",
                    ("`%s` указывает на правильный сигнал репозитория, "
                            + "но задаче всё ещё нужна более точная команда проверки, "
                            + "прежде чем ответ станет правильным.")
                            .formatted(normalizedAnswer),
                    List.of(
                            "Пользователь уже стартовал из правильного семейства "
                                    + "команд проверки, поэтому сообщение о повторе "
                                    + "должно поддержать это направление, а не считать "
                                    + "ответ полным промахом.",
                            "Следующая подсказка может сузить форму команды, "
                                    + "не меняя саму панель обратной связи."
                    )
            );
            case "unsupported-answer-type" -> new RetryExplanationNarrative(
                    "Вернитесь к поддерживаемому вводу команды",
                    "unsupported",
                    "Сейчас проверяются только ответы в виде команды, "
                            + "поэтому перед следующей попыткой нужно вернуть "
                            + "поддерживаемый формат.",
                    List.of(
                            "Запрос принимается, но такой тип ответа всё ещё считается неподдерживаемым.",
                            "Панель повтора должна сначала вернуть пользователя "
                                    + "к поддерживаемому командному формату, "
                                    + "а уже потом пробовать более богатые варианты ответа."
                    )
            );
            case "branch-choice-needs-task-alignment" -> new RetryExplanationNarrative(
                    "Подтвердите текущую ветку до решения о переключении",
                    "incorrect",
                    "В этом сценарии безопасный следующий шаг — сначала прочитать "
                            + "активную ветку или branch-aware status, потому что "
                            + "репозиторий уже содержит незавершённые hotfix-изменения. "
                            + "Переключение прямо сейчас оставалось бы догадкой.",
                    List.of(
                            "Сценарий пока не просит выполнять `checkout`. "
                                    + "Сначала он требует собрать минимальный branch cue "
                                    + "и подтвердить, где уже открыта работа.",
                            "После такой проверки пользователь сможет аргументированно "
                                    + "решить, допустимо ли переключение, "
                                    + "не смешивая hotfix и feature-контекст."
                    )
            );
            case "history-cleanup-requires-plan-first" -> new RetryExplanationNarrative(
                    "Сначала просмотрите историю, потом переписывайте коммиты",
                    "incorrect",
                    "В этом сценарии следующий безопасный шаг — сначала показать "
                            + "недавний стек истории в читаемом виде, потому что "
                            + "`fixup!` и WIP-сигналы ещё нужно явно увидеть "
                            + "до любого `rebase`.",
                    List.of(
                            "Правильная следующая попытка остаётся в семействе "
                                    + "`git log` и помогает увидеть, "
                                    + "какие коммиты вообще войдут в cleanup.",
                            "Только после такого preview можно аргументированно "
                                    + "обсуждать interactive rebase "
                                    + "или другую команду переписывания."
                    )
            );
            case "inspection-command-should-come-before-mutation" -> new RetryExplanationNarrative(
                    "Проверьте рабочее дерево до любых изменений",
                    "incorrect",
                    "Безопасное следующее действие в этом сценарии — сначала "
                            + "проверить состояние репозитория, "
                            + "а не сразу переходить к изменяющей команде.",
                    List.of(
                            "Это упражнение про чтение текущего состояния до действия, "
                                    + "а не про выбор целевой ветки или изменение файлов.",
                            "Панель повтора должна удерживать пользователя "
                                    + "в цикле проверки, пока форма правильной команды "
                                    + "не станет очевидной."
                    )
            );
            case "remote-sync-requires-fetch-first" -> new RetryExplanationNarrative(
                    "Сначала обновите удалённое состояние, потом интегрируйте",
                    "incorrect",
                    "В этом сценарии безопасный следующий шаг — отдельно получить "
                            + "новые remote refs, потому что без свежего `fetch` "
                            + "решение о `pull` или другой интеграции "
                            + "остаётся преждевременным.",
                    List.of(
                            "Правильная следующая попытка должна оставаться "
                                    + "в семействе `git fetch` и обновить "
                                    + "наблюдаемое состояние `origin/main` без слияния.",
                            "Только после такого preview можно предметно решать, нужен ли `pull`, `merge` или `rebase`."
                    )
            );
            default -> new RetryExplanationNarrative(
                    "Вернитесь к цели сценария перед следующей попыткой",
                    "incorrect",
                    "Цикл повтора должен вернуть пользователя к цели сценария, "
                            + "а затем сузить следующую попытку самым маленьким "
                            + "доступным безопасным намёком.",
                    List.of(
                            "Когда сценарно-специфичная подсказка недоступна, "
                                    + "объяснение должно оставаться "
                                    + "сфокусированным на цели задачи, "
                                    + "а не изобретать новые правила.",
                            "Следующая подсказка всё ещё может сузить путь повтора, не затрагивая слой policy."
                    )
            );
        };
    }

    private String normalizeSubmittedAnswer(String submittedAnswer) {
        if (submittedAnswer == null || submittedAnswer.isBlank()) {
            return "отправленная команда";
        }
        return submittedAnswer.trim().replaceAll("\\s+", " ");
    }

    private record RetryExplanationNarrative(
            String title,
            String tone,
            String message,
            List<String> details
    ) {
    }
}
