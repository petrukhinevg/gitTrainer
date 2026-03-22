package com.example.gittrainer.session.api;

import com.example.gittrainer.session.application.RetryFeedbackCatalog;
import com.example.gittrainer.session.application.RetryHintTemplate;
import com.example.gittrainer.session.domain.RetryHintSelection;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
class RetryHintResponseFactory {

    private final RetryFeedbackCatalog retryFeedbackCatalog;

    RetryHintResponseFactory(RetryFeedbackCatalog retryFeedbackCatalog) {
        this.retryFeedbackCatalog = retryFeedbackCatalog;
    }

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

        RetryHintTemplate hintTemplate = retryFeedbackCatalog.findHintTemplate(templateCode(hintSelection.code()))
                .orElseGet(this::fallbackTemplate);
        boolean strongerHintUnlocked = "strong".equals(hintSelection.level());
        List<RetryHintRevealResponse> reveals = strongerHintUnlocked
                ? List.of(
                        reveal(
                                "nudge",
                                "Показать первую подсказку",
                                hintTemplate.nudgeTitle(),
                                hintTemplate.nudgeMessage()
                        ),
                        reveal(
                                "strong",
                                "Показать усиленную подсказку",
                                hintTemplate.strongTitle(),
                                hintTemplate.strongMessage()
                        )
                )
                : List.of(
                        reveal(
                                "nudge",
                                "Показать первую подсказку",
                                hintTemplate.nudgeTitle(),
                                hintTemplate.nudgeMessage()
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

    private String templateCode(String hintCode) {
        if (hintCode == null || hintCode.isBlank()) {
            return "generic-retry";
        }
        if (hintCode.endsWith("-strong")) {
            return hintCode.substring(0, hintCode.length() - "-strong".length());
        }
        if (hintCode.endsWith("-nudge")) {
            return hintCode.substring(0, hintCode.length() - "-nudge".length());
        }
        return hintCode;
    }

    private RetryHintTemplate fallbackTemplate() {
        return retryFeedbackCatalog.findHintTemplate("generic-retry")
                .orElse(new RetryHintTemplate(
                        "Вернитесь к цели сценария",
                        "Переформулируйте задачу в одном предложении.",
                        "Покажите самый маленький безопасный следующий шаг",
                        "Уберите лишнее намерение и выберите команду, "
                                + "которая даёт недостающий сигнал до любого более крупного действия."
                ));
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
}
