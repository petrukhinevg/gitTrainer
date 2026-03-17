package com.example.gittrainer.session.application;

public class SessionNotFoundException extends RuntimeException {

    public SessionNotFoundException(String sessionId) {
        super("Сессия недоступна для id: " + sessionId);
    }
}
