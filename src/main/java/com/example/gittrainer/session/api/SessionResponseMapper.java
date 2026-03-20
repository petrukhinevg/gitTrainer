package com.example.gittrainer.session.api;

import com.example.gittrainer.session.application.StartSessionResult;
import com.example.gittrainer.session.application.SubmitAnswerResult;
import com.example.gittrainer.session.domain.RetryExplanationSelection;
import com.example.gittrainer.session.domain.RetryGuidance;
import com.example.gittrainer.session.domain.RetryHintSelection;
import com.example.gittrainer.session.domain.RetryState;
import com.example.gittrainer.session.domain.TrainingSession;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.List;

@Component
public class SessionResponseMapper {

    public SessionStartResponse toStartResponse(StartSessionResult result) {
        return new SessionStartResponse(
                result.session().sessionId(),
                new SessionScenarioResponse(
                        result.session().scenarioSlug(),
                        result.session().scenarioTitle(),
                        result.session().scenarioSource()
                ),
                toLifecycleResponse(result.session()),
                new SessionSubmissionBoundaryResponse(
                        result.supportedAnswerTypes(),
                        toOutcomeResponse(result.placeholderOutcome()),
                        toRetryFeedbackResponse(
                                result.retryState(),
                                null,
                                result.placeholderOutcome(),
                                null
                        )
                )
        );
    }

    public SessionSubmissionResponse toSubmissionResponse(SubmitAnswerResult result) {
        return new SessionSubmissionResponse(
                result.submissionId(),
                result.session().sessionId(),
                result.attemptNumber(),
                result.submittedAt(),
                toLifecycleResponse(result.session()),
                new SubmittedAnswerResponse(result.answer().type(), result.answer().value()),
                toOutcomeResponse(result.outcome()),
                toRetryFeedbackResponse(
                        result.retryState(),
                        result.retryGuidance(),
                        result.outcome(),
                        result.answer().value()
                )
        );
    }

    private SessionLifecycleResponse toLifecycleResponse(TrainingSession session) {
        return new SessionLifecycleResponse(
                session.state().name().toLowerCase(Locale.ROOT),
                session.startedAt(),
                session.submissionCount(),
                session.lastSubmissionId()
        );
    }

    private SubmissionOutcomeResponse toOutcomeResponse(SubmissionOutcome outcome) {
        return new SubmissionOutcomeResponse(
                outcome.status(),
                outcome.correctness(),
                outcome.code(),
                outcome.message()
        );
    }

    private RetryFeedbackResponse toRetryFeedbackResponse(
            RetryState retryState,
            RetryGuidance retryGuidance,
            SubmissionOutcome outcome,
            String submittedAnswer
    ) {
        if (outcome == null || retryState == null || retryState.attemptCount() == 0 || "placeholder".equals(outcome.status())) {
            return placeholderRetryFeedback(retryState);
        }

        if (!outcome.requiresRetry()) {
            return resolvedRetryFeedback(retryState);
        }

        return guidedRetryFeedback(retryState, retryGuidance, submittedAnswer);
    }

    private RetryFeedbackResponse placeholderRetryFeedback(RetryState retryState) {
        RetryState safeRetryState = retryState == null ? RetryState.initial() : retryState;
        return new RetryFeedbackResponse(
                "placeholder",
                new RetryStateResponse(
                        toRetryStateStatus(safeRetryState),
                        safeRetryState.attemptCount(),
                        toRetryEligibility(safeRetryState)
                ),
                new RetryExplanationResponse(
                        "placeholder",
                        "Подсказка для повтора",
                        "neutral",
                        "Подсказка для повтора появится здесь после первой проверенной отправки.",
                        List.of()
                ),
                new RetryHintResponse(
                        "placeholder",
                        "baseline",
                        "Прогресс подсказок остаётся в ожидании, пока пользователь не получит проверенную обратную связь.",
                        List.of()
                )
        );
    }

    private RetryFeedbackResponse resolvedRetryFeedback(RetryState retryState) {
        return new RetryFeedbackResponse(
                "resolved",
                new RetryStateResponse(
                        toRetryStateStatus(retryState),
                        retryState.attemptCount(),
                        toRetryEligibility(retryState)
                ),
                new RetryExplanationResponse(
                        "resolved",
                        "Повторное объяснение не требуется",
                        "success",
                        "Эта попытка уже привела к безопасному следующему шагу, поэтому панель повтора остаётся спокойной.",
                        List.of()
                ),
                new RetryHintResponse(
                        "resolved",
                        "none",
                        "После правильного ответа дополнительная подсказка не нужна.",
                        List.of()
                )
        );
    }

    private RetryFeedbackResponse guidedRetryFeedback(
            RetryState retryState,
            RetryGuidance retryGuidance,
            String submittedAnswer
    ) {
        RetryGuidance safeGuidance = retryGuidance == null ? RetryGuidance.notNeeded() : retryGuidance;

        return new RetryFeedbackResponse(
                "guided",
                new RetryStateResponse(
                        toRetryStateStatus(retryState),
                        retryState.attemptCount(),
                        toRetryEligibility(retryState)
                ),
                toGuidedExplanationResponse(safeGuidance.explanation(), submittedAnswer),
                toGuidedHintResponse(safeGuidance.hint())
        );
    }

    private RetryExplanationResponse toGuidedExplanationResponse(
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

    private RetryHintResponse toGuidedHintResponse(RetryHintSelection hintSelection) {
        RetryHintNarrative narrative = hintNarrative(hintSelection);
        return new RetryHintResponse(
                "guided",
                narrative.level(),
                narrative.message(),
                narrative.reveals()
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
                    "`%s` указывает на правильный сигнал репозитория, но задаче всё ещё нужна более точная команда проверки, прежде чем ответ станет правильным."
                            .formatted(normalizedAnswer),
                    List.of(
                            "Пользователь уже стартовал из правильного семейства команд проверки, поэтому сообщение о повторе должно поддержать это направление, а не считать ответ полным промахом.",
                            "Следующая подсказка может сузить форму команды, не меняя саму панель обратной связи."
                    )
            );
            case "unsupported-answer-type" -> new RetryExplanationNarrative(
                    "Вернитесь к поддерживаемому вводу команды",
                    "unsupported",
                    "Сейчас проверяются только ответы в виде команды, поэтому перед следующей попыткой нужно вернуть поддерживаемый формат.",
                    List.of(
                            "Запрос принимается, но такой тип ответа всё ещё считается неподдерживаемым.",
                            "Панель повтора должна сначала вернуть пользователя к поддерживаемому командному формату, а уже потом пробовать более богатые варианты ответа."
                    )
            );
            case "branch-choice-needs-task-alignment" -> new RetryExplanationNarrative(
                    "Подтвердите текущую ветку до решения о переключении",
                    "incorrect",
                    "В этом сценарии безопасный следующий шаг — сначала прочитать активную ветку или branch-aware status, потому что репозиторий уже содержит незавершённые hotfix-изменения. Переключение прямо сейчас оставалось бы догадкой.",
                    List.of(
                            "Сценарий пока не просит выполнять `checkout`. Сначала он требует собрать минимальный branch cue и подтвердить, где уже открыта работа.",
                            "После такой проверки пользователь сможет аргументированно решить, допустимо ли переключение, не смешивая hotfix и feature-контекст."
                    )
            );
            case "history-cleanup-requires-plan-first" -> new RetryExplanationNarrative(
                    "Сначала просмотрите историю, потом переписывайте коммиты",
                    "incorrect",
                    "В этом сценарии следующий безопасный шаг — сначала показать недавний стек истории в читаемом виде, потому что `fixup!` и WIP-сигналы ещё нужно явно увидеть до любого `rebase`.",
                    List.of(
                            "Правильная следующая попытка остаётся в семействе `git log` и помогает увидеть, какие коммиты вообще войдут в cleanup.",
                            "Только после такого preview можно аргументированно обсуждать interactive rebase или другую команду переписывания."
                    )
            );
            case "inspection-command-should-come-before-mutation" -> new RetryExplanationNarrative(
                    "Проверьте рабочее дерево до любых изменений",
                    "incorrect",
                    "Безопасное следующее действие в этом сценарии — сначала проверить состояние репозитория, а не сразу переходить к изменяющей команде.",
                    List.of(
                            "Это упражнение про чтение текущего состояния до действия, а не про выбор целевой ветки или изменение файлов.",
                            "Панель повтора должна удерживать пользователя в цикле проверки, пока форма правильной команды не станет очевидной."
                    )
            );
            case "remote-sync-requires-fetch-first" -> new RetryExplanationNarrative(
                    "Сначала обновите удалённое состояние, потом интегрируйте",
                    "incorrect",
                    "В этом сценарии безопасный следующий шаг — отдельно получить новые remote refs, потому что без свежего `fetch` решение о `pull` или другой интеграции остаётся преждевременным.",
                    List.of(
                            "Правильная следующая попытка должна оставаться в семействе `git fetch` и обновить наблюдаемое состояние `origin/main` без слияния.",
                            "Только после такого preview можно предметно решать, нужен ли `pull`, `merge` или `rebase`."
                    )
            );
            default -> new RetryExplanationNarrative(
                    "Вернитесь к цели сценария перед следующей попыткой",
                    "incorrect",
                    "Цикл повтора должен вернуть пользователя к цели сценария, а затем сузить следующую попытку самым маленьким доступным безопасным намёком.",
                    List.of(
                            "Когда сценарно-специфичная подсказка недоступна, объяснение должно оставаться сфокусированным на цели задачи, а не изобретать новые правила.",
                            "Следующая подсказка всё ещё может сузить путь повтора, не затрагивая слой policy."
                    )
            );
        };
    }

    private RetryHintNarrative hintNarrative(RetryHintSelection hintSelection) {
        if (hintSelection == null || !"selected".equals(hintSelection.status())) {
            return new RetryHintNarrative("baseline", "Подсказка сейчас недоступна.", List.of());
        }

        HintCopy hintCopy = hintCopy(hintSelection.code());
        boolean strongerHintUnlocked = "strong".equals(hintSelection.level());
        List<RetryHintRevealResponse> reveals = strongerHintUnlocked
                ? List.of(
                new RetryHintRevealResponse("nudge", "Показать первую подсказку", hintCopy.nudgeTitle(), hintCopy.nudgeMessage()),
                new RetryHintRevealResponse("strong", "Показать усиленную подсказку", hintCopy.strongTitle(), hintCopy.strongMessage())
        )
                : List.of(
                new RetryHintRevealResponse("nudge", "Показать первую подсказку", hintCopy.nudgeTitle(), hintCopy.nudgeMessage())
        );

        return new RetryHintNarrative(
                hintSelection.level(),
                strongerHintUnlocked
                        ? "Теперь доступна усиленная подсказка, потому что пользователь уже промахнулся как минимум один раз."
                        : "Сначала дайте более мягкий намёк, а уже потом открывайте сильную подсказку.",
                reveals
        );
    }

    private HintCopy hintCopy(String hintCode) {
        String code = hintCode == null ? "" : hintCode;

        return switch (code) {
            case "partial-answer-nudge", "partial-answer-strong" -> new HintCopy(
                    "Останьтесь в том же семействе проверок",
                    "Оставайтесь в той же зоне проверки, но уберите лишний охват или переключитесь на каноничную безопасную команду для сценария.",
                    "Сверьтесь с точным безопасным шагом",
                    "Ищите самую маленькую команду, которая проверяет именно то состояние репозитория, о котором спрашивает задача, без лишнего намерения."
            );
            case "unsupported-answer-type-nudge", "unsupported-answer-type-strong" -> new HintCopy(
                    "Используйте режим текста команды",
                    "Переключите тип ответа обратно на текст команды и оставьте следующую попытку в форме простой команды проверки.",
                    "Ориентируйтесь на поддерживаемый пример",
                    "Посмотрите на бейдж поддерживаемого типа ответа над формой и сначала вернитесь к этому режиму."
            );
            case "branch-intent-nudge", "branch-intent-strong" -> new HintCopy(
                    "Сначала подтвердите активную ветку",
                    "Выберите branch-reading шаг, который ничего не меняет в репозитории, но явно показывает, где сейчас открыта работа.",
                    "Выберите команду чтения branch-контекста",
                    "Нужна самая маленькая команда из семейства `git branch --show-current` или branch-aware `git status`, которая подтверждает текущую ветку до любых решений о `checkout`."
            );
            case "history-plan-nudge", "history-plan-strong" -> new HintCopy(
                    "Сначала покажите компактную историю",
                    "Оставайтесь в preview-режиме и выберите команду, которая показывает верхушку истории с `fixup!` и WIP, не меняя коммиты.",
                    "Выберите команду просмотра графа истории",
                    "Нужна компактная команда из семейства `git log --oneline --decorate`; вариант с `--graph` тоже подходит, если делает стек читаемее."
            );
            case "working-tree-inspection-nudge", "working-tree-inspection-strong" -> new HintCopy(
                    "Начните с проверки рабочего дерева",
                    "Сценарий спрашивает о состоянии репозитория, поэтому следующая попытка должна оставаться в семействе `git status`, а не менять файлы или ветки.",
                    "Используйте `git status` как безопасный первый шаг",
                    "Сначала отправьте `git status` или `git status --short`, чтобы подтвердить изменённые и неотслеживаемые файлы до любого следующего действия."
            );
            case "remote-fetch-nudge", "remote-fetch-strong" -> new HintCopy(
                    "Сначала получите свежие remote refs",
                    "Выберите отдельный шаг получения данных с удалённого репозитория, который обновляет картину `origin/main`, но не интегрирует изменения в локальную ветку.",
                    "Выберите команду из семейства `git fetch`",
                    "Нужна команда вроде `git fetch` или `git fetch origin`, а не `pull`, потому что сценарий сначала оценивает обновление remote-tracking состояния."
            );
            default -> new HintCopy(
                    "Вернитесь к цели сценария",
                    "Переформулируйте задачу в одном предложении и держите следующую попытку сфокусированной на самой маленькой безопасной команде, которая на неё отвечает.",
                    "Покажите самый маленький безопасный следующий шаг",
                    "Уберите лишнее намерение и выберите команду, которая даёт недостающий сигнал до любого более крупного действия."
            );
        };
    }

    private String normalizeSubmittedAnswer(String submittedAnswer) {
        if (submittedAnswer == null || submittedAnswer.isBlank()) {
            return "отправленная команда";
        }
        return submittedAnswer.trim().replaceAll("\\s+", " ");
    }

    private String toRetryStateStatus(RetryState retryState) {
        return switch (retryState.phase()) {
            case READY -> "idle";
            case RETRY_AVAILABLE -> "retry-available";
            case COMPLETED -> "complete";
        };
    }

    private String toRetryEligibility(RetryState retryState) {
        return switch (retryState.retryEligibility()) {
            case NOT_NEEDED -> "not-needed";
            case ELIGIBLE -> "eligible";
        };
    }

    private record RetryExplanationNarrative(
            String title,
            String tone,
            String message,
            List<String> details
    ) {
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
