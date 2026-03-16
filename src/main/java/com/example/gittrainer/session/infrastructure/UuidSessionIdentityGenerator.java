package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.SessionIdentityGenerator;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class UuidSessionIdentityGenerator implements SessionIdentityGenerator {

    @Override
    public String nextSessionId() {
        return "session_" + UUID.randomUUID();
    }

    @Override
    public String nextSubmissionId() {
        return "submission_" + UUID.randomUUID();
    }
}
