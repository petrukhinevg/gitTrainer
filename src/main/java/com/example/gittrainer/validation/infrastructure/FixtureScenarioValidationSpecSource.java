package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.validation.application.ScenarioValidationSpec;
import com.example.gittrainer.validation.application.ScenarioValidationSpecSource;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Profile("test | local-memory")
public class FixtureScenarioValidationSpecSource implements ScenarioValidationSpecSource {

    @Override
    public Optional<ScenarioValidationSpec> findSpec(String scenarioSlug, String answerType) {
        return AuthoredScenarioValidationLibrary.findSpec("fixture", scenarioSlug, answerType);
    }
}
