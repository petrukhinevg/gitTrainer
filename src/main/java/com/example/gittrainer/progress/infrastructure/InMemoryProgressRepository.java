package com.example.gittrainer.progress.infrastructure;

import com.example.gittrainer.progress.application.ProgressRepository;
import com.example.gittrainer.progress.domain.ScenarioAttemptOutcome;
import com.example.gittrainer.progress.domain.ScenarioAttemptStart;
import com.example.gittrainer.progress.domain.ScenarioCompletionEvent;
import com.example.gittrainer.progress.domain.ScenarioProgressRecord;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Repository
public class InMemoryProgressRepository implements ProgressRepository {

    private final ConcurrentHashMap<String, ScenarioProgressRecord> recordsByScenario = new ConcurrentHashMap<>();
    private final Queue<ScenarioCompletionEvent> completionEvents = new ConcurrentLinkedQueue<>();

    @Override
    public ScenarioProgressRecord recordAttemptStart(ScenarioAttemptStart attemptStart) {
        return recordsByScenario.compute(
                attemptStart.scenarioSlug(),
                (ignored, existingRecord) -> existingRecord == null
                        ? ScenarioProgressRecord.started(attemptStart)
                        : existingRecord.recordAttemptStart(attemptStart)
        );
    }

    @Override
    public ScenarioProgressRecord recordAttemptOutcome(ScenarioAttemptOutcome attemptOutcome) {
        ScenarioProgressRecord updatedRecord = recordsByScenario.compute(
                attemptOutcome.scenarioSlug(),
                (ignored, existingRecord) -> {
                    ScenarioProgressRecord baseRecord = existingRecord == null
                            ? ScenarioProgressRecord.started(new ScenarioAttemptStart(
                            attemptOutcome.scenarioSlug(),
                            attemptOutcome.scenarioTitle(),
                            attemptOutcome.scenarioSource(),
                            attemptOutcome.sessionId(),
                            attemptOutcome.submittedAt()
                    ))
                            : existingRecord;
                    return baseRecord.recordAttemptOutcome(attemptOutcome);
                }
        );

        if ("correct".equals(attemptOutcome.correctness())) {
            completionEvents.add(ScenarioCompletionEvent.from(attemptOutcome));
        }

        return updatedRecord;
    }

    @Override
    public Optional<ScenarioProgressRecord> findByScenarioSlug(String scenarioSlug) {
        return Optional.ofNullable(recordsByScenario.get(scenarioSlug));
    }

    @Override
    public List<ScenarioProgressRecord> findAll() {
        return List.copyOf(recordsByScenario.values());
    }

    @Override
    public List<ScenarioCompletionEvent> findCompletionEvents() {
        return List.copyOf(completionEvents);
    }
}
