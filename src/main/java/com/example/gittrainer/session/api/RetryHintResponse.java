package com.example.gittrainer.session.api;

import java.util.List;

record RetryHintResponse(
        String status,
        String level,
        String message,
        List<RetryHintRevealResponse> reveals
) {
}
