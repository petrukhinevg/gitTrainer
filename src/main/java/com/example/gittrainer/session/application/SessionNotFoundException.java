package com.example.gittrainer.session.application;

public class SessionNotFoundException extends RuntimeException {

    public SessionNotFoundException(String sessionId) {
        super("Session is unavailable for id: " + sessionId);
    }
}
