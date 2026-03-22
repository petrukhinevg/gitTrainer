package com.example.gittrainer.session.api;

import com.example.gittrainer.session.application.RetryExplanationTemplate;
import com.example.gittrainer.session.application.RetryFeedbackCatalog;
import com.example.gittrainer.session.domain.RetryExplanationSelection;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
class RetryExplanationResponseFactory {

    private final RetryFeedbackCatalog retryFeedbackCatalog;

    RetryExplanationResponseFactory(RetryFeedbackCatalog retryFeedbackCatalog) {
        this.retryFeedbackCatalog = retryFeedbackCatalog;
    }

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
        String code = explanationSelection == null ? null : explanationSelection.code();
        RetryExplanationTemplate template = retryFeedbackCatalog.findExplanationTemplate(code)
                .orElseGet(this::fallbackTemplate);
        return new RetryExplanationNarrative(
                template.title(),
                template.tone(),
                template.messageTemplate().replace("{{submittedAnswer}}", normalizedAnswer),
                template.details()
        );
    }

    private String normalizeSubmittedAnswer(String submittedAnswer) {
        if (submittedAnswer == null || submittedAnswer.isBlank()) {
            return "отправленная команда";
        }
        return submittedAnswer.trim().replaceAll("\\s+", " ");
    }

    private RetryExplanationTemplate fallbackTemplate() {
        return retryFeedbackCatalog.findExplanationTemplate("retry-guidance-needs-scenario-review")
                .orElse(new RetryExplanationTemplate(
                        "Вернитесь к цели сценария перед следующей попыткой",
                        "incorrect",
                        "Цикл повтора должен вернуть пользователя к цели сценария, "
                                + "а затем сузить следующую попытку самым маленьким "
                                + "доступным безопасным намёком.",
                        List.of()
                ));
    }

    private record RetryExplanationNarrative(
            String title,
            String tone,
            String message,
            List<String> details
    ) {
    }
}
