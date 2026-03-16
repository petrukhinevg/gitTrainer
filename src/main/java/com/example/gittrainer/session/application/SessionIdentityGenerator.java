package com.example.gittrainer.session.application;

public interface SessionIdentityGenerator {

    String nextSessionId();

    String nextSubmissionId();
}
