package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.validation.application.ValidationRunRepository;
import com.example.gittrainer.validation.domain.ValidationRunRecord;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@Profile("test | local-memory")
public class InMemoryValidationRunRepository implements ValidationRunRepository {

    private final Map<String, ValidationRunRecord> runsById = new ConcurrentHashMap<>();

    @Override
    public void save(ValidationRunRecord validationRunRecord) {
        runsById.put(validationRunRecord.validationRunId(), validationRunRecord);
    }

    public List<ValidationRunRecord> findAll() {
        return runsById.values().stream()
                .sorted((left, right) -> left.recordedAt().compareTo(right.recordedAt()))
                .toList();
    }

    public void clear() {
        runsById.clear();
    }
}
