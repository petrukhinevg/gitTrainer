package com.example.gittrainer.validation.cli;

import java.util.List;

public record CliValidationResponse(
        String status,
        String correctness,
        String code,
        String message,
        List<CliValidationObservation> observations,
        List<String> artifacts
) {
}
