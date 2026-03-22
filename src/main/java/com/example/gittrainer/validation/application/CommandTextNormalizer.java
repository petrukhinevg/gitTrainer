package com.example.gittrainer.validation.application;

public final class CommandTextNormalizer {

    private CommandTextNormalizer() {
    }

    public static String normalize(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toLowerCase();
    }
}
