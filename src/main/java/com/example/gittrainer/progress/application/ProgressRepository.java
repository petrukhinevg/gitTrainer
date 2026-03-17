package com.example.gittrainer.progress.application;

import com.example.gittrainer.progress.domain.ScenarioAttemptOutcome;
import com.example.gittrainer.progress.domain.ScenarioAttemptStart;
import com.example.gittrainer.progress.domain.ScenarioCompletionEvent;
import com.example.gittrainer.progress.domain.ScenarioProgressRecord;

import java.util.List;
import java.util.Optional;

public interface ProgressRepository {

    ScenarioProgressRecord recordAttemptStart(ScenarioAttemptStart attemptStart);

    ScenarioProgressRecord recordAttemptOutcome(ScenarioAttemptOutcome attemptOutcome);

    Optional<ScenarioProgressRecord> findByScenarioSlug(String scenarioSlug);

    List<ScenarioProgressRecord> findAll();

    List<ScenarioCompletionEvent> findCompletionEvents();
}
