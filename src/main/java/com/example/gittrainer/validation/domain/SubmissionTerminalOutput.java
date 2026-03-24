package com.example.gittrainer.validation.domain;

public record SubmissionTerminalOutput(
        String stdout,
        String stderr
) {

    public boolean hasContent() {
        return (stdout != null && !stdout.isBlank()) || (stderr != null && !stderr.isBlank());
    }
}
