package com.example.gittrainer.session.api;

import com.example.gittrainer.session.domain.RetryHintSelection;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
class RetryHintResponseFactory {

    RetryHintResponse placeholderResponse() {
        return new RetryHintResponse(
                "placeholder",
                "baseline",
                "Прогресс подсказок остаётся в ожидании, пока пользователь "
                        + "не получит проверенную обратную связь.",
                List.of()
        );
    }

    RetryHintResponse resolvedResponse() {
        return new RetryHintResponse(
                "resolved",
                "none",
                "После правильного ответа дополнительная подсказка не нужна.",
                List.of()
        );
    }

    RetryHintResponse guidedResponse(RetryHintSelection hintSelection) {
        RetryHintNarrative narrative = hintNarrative(hintSelection);
        return new RetryHintResponse(
                "guided",
                narrative.level(),
                narrative.message(),
                narrative.reveals()
        );
    }

    private RetryHintNarrative hintNarrative(RetryHintSelection hintSelection) {
        if (hintSelection == null || !"selected".equals(hintSelection.status())) {
            return new RetryHintNarrative("baseline", "Подсказка сейчас недоступна.", List.of());
        }

        HintCopy hintCopy = hintCopy(hintSelection.code());
        boolean strongerHintUnlocked = "strong".equals(hintSelection.level());
        List<RetryHintRevealResponse> reveals = strongerHintUnlocked
                ? List.of(
                        reveal(
                                "nudge",
                                "Показать первую подсказку",
                                hintCopy.nudgeTitle(),
                                hintCopy.nudgeMessage()
                        ),
                        reveal(
                                "strong",
                                "Показать усиленную подсказку",
                                hintCopy.strongTitle(),
                                hintCopy.strongMessage()
                        )
                )
                : List.of(
                        reveal(
                                "nudge",
                                "Показать первую подсказку",
                                hintCopy.nudgeTitle(),
                                hintCopy.nudgeMessage()
                        )
                );

        return new RetryHintNarrative(
                hintSelection.level(),
                strongerHintUnlocked
                        ? "Теперь доступна усиленная подсказка, потому что "
                                + "пользователь уже промахнулся как минимум один раз."
                        : "Сначала дайте более мягкий намёк, а уже потом открывайте сильную подсказку.",
                reveals
        );
    }

    private HintCopy hintCopy(String hintCode) {
        String code = hintCode == null ? "" : hintCode;

        return switch (code) {
            case "partial-answer-nudge", "partial-answer-strong" -> new HintCopy(
                    "Останьтесь в том же семействе проверок",
                    "Оставайтесь в той же зоне проверки, но уберите лишний охват "
                            + "или переключитесь на каноничную безопасную команду "
                            + "для сценария.",
                    "Сверьтесь с точным безопасным шагом",
                    "Ищите самую маленькую команду, которая проверяет именно то "
                            + "состояние репозитория, о котором спрашивает задача, "
                            + "без лишнего намерения."
            );
            case "unsupported-answer-type-nudge", "unsupported-answer-type-strong" -> new HintCopy(
                    "Используйте режим текста команды",
                    "Переключите тип ответа обратно на текст команды "
                            + "и оставьте следующую попытку "
                            + "в форме простой команды проверки.",
                    "Ориентируйтесь на поддерживаемый пример",
                    "Посмотрите на бейдж поддерживаемого типа ответа над формой "
                            + "и сначала вернитесь к этому режиму."
            );
            case "branch-intent-nudge", "branch-intent-strong" -> new HintCopy(
                    "Сначала подтвердите активную ветку",
                    "Выберите branch-reading шаг, который ничего не меняет "
                            + "в репозитории, но явно показывает, "
                            + "где сейчас открыта работа.",
                    "Выберите команду чтения branch-контекста",
                    "Нужна самая маленькая команда из семейства "
                            + "`git branch --show-current` или branch-aware "
                            + "`git status`, которая подтверждает текущую ветку "
                            + "до любых решений о `checkout`."
            );
            case "history-plan-nudge", "history-plan-strong" -> new HintCopy(
                    "Сначала покажите компактную историю",
                    "Оставайтесь в preview-режиме и выберите команду, "
                            + "которая показывает верхушку истории с `fixup!` "
                            + "и WIP, не меняя коммиты.",
                    "Выберите команду просмотра графа истории",
                    "Нужна компактная команда из семейства "
                            + "`git log --oneline --decorate`; вариант с `--graph` "
                            + "тоже подходит, если делает стек читаемее."
            );
            case "working-tree-inspection-nudge", "working-tree-inspection-strong" -> new HintCopy(
                    "Начните с проверки рабочего дерева",
                    "Сценарий спрашивает о состоянии репозитория, "
                            + "поэтому следующая попытка должна оставаться "
                            + "в семействе `git status`, "
                            + "а не менять файлы или ветки.",
                    "Используйте `git status` как безопасный первый шаг",
                    "Сначала отправьте `git status` или `git status --short`, "
                            + "чтобы подтвердить изменённые "
                            + "и неотслеживаемые файлы "
                            + "до любого следующего действия."
            );
            case "remote-fetch-nudge", "remote-fetch-strong" -> new HintCopy(
                    "Сначала получите свежие remote refs",
                    "Выберите отдельный шаг получения данных с удалённого "
                            + "репозитория, который обновляет картину "
                            + "`origin/main`, но не интегрирует изменения "
                            + "в локальную ветку.",
                    "Выберите команду из семейства `git fetch`",
                    "Нужна команда вроде `git fetch` или `git fetch origin`, "
                            + "а не `pull`, потому что сценарий сначала оценивает "
                            + "обновление remote-tracking состояния."
            );
            default -> new HintCopy(
                    "Вернитесь к цели сценария",
                    "Переформулируйте задачу в одном предложении "
                            + "и держите следующую попытку сфокусированной "
                            + "на самой маленькой безопасной команде, "
                            + "которая на неё отвечает.",
                    "Покажите самый маленький безопасный следующий шаг",
                    "Уберите лишнее намерение и выберите команду, "
                            + "которая даёт недостающий сигнал "
                            + "до любого более крупного действия."
            );
        };
    }

    private RetryHintRevealResponse reveal(
            String id,
            String label,
            String title,
            String message
    ) {
        return new RetryHintRevealResponse(id, label, title, message);
    }

    private record RetryHintNarrative(
            String level,
            String message,
            List<RetryHintRevealResponse> reveals
    ) {
    }

    private record HintCopy(
            String nudgeTitle,
            String nudgeMessage,
            String strongTitle,
            String strongMessage
    ) {
    }
}
