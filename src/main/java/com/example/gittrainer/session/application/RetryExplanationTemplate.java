package com.example.gittrainer.session.application;

import java.util.List;

public record RetryExplanationTemplate(
        String title,
        String tone,
        String messageTemplate,
        List<String> details
) {

    public RetryExplanationTemplate {
        details = details == null ? List.of() : List.copyOf(details);
    }
}
