package com.example.gittrainer.progress.application;

import org.springframework.stereotype.Service;

@Service
public class LoadProgressSummaryUseCase {

    public ProgressSummary load() {
        return new ProgressSummary(java.util.List.of());
    }
}
