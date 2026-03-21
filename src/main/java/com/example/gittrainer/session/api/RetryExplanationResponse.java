package com.example.gittrainer.session.api;

import java.util.List;

record RetryExplanationResponse(
        String status,
        String title,
        String tone,
        String message,
        List<String> details
) {
}
