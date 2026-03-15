package com.example.gittrainer.session.application;

public class InvalidSessionCommandException extends RuntimeException {

    public InvalidSessionCommandException(String message) {
        super(message);
    }
}
