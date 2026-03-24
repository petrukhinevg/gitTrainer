package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.validation.application.CommandTextNormalizer;
import com.example.gittrainer.validation.application.ScenarioValidationRule;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

final class AuthoredScenarioValidationResourceLoader {

    private static final String RESOURCE_PATH = "validation/authored-scenario-validation.json";

    private final Map<String, AuthoredScenarioValidationLibrary.AuthoredScenarioValidationDefinition> definitionsBySlug;

    AuthoredScenarioValidationResourceLoader() {
        this.definitionsBySlug = readBundle().definitions().stream()
                .map(ValidationDefinitionResource::toDefinition)
                .collect(java.util.stream.Collectors.toMap(
                        AuthoredScenarioValidationLibrary.AuthoredScenarioValidationDefinition::scenarioSlug,
                        definition -> definition,
                        (left, right) -> right,
                        LinkedHashMap::new
                ));
    }

    Optional<AuthoredScenarioValidationLibrary.AuthoredScenarioValidationDefinition> findDefinition(String scenarioSlug) {
        return Optional.ofNullable(definitionsBySlug.get(scenarioSlug));
    }

    Map<String, AuthoredScenarioValidationLibrary.AuthoredScenarioValidationDefinition> definitions() {
        return definitionsBySlug;
    }

    private ValidationBundleResource readBundle() {
        ObjectMapper objectMapper = JsonMapper.builder()
                .findAndAddModules()
                .build();
        try (InputStream inputStream = new ClassPathResource(RESOURCE_PATH).getInputStream()) {
            return objectMapper.readValue(inputStream, ValidationBundleResource.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Не удалось десериализовать authored scenario validation bundle.", exception);
        } catch (IOException exception) {
            throw new IllegalStateException("Не удалось загрузить authored scenario validation bundle.", exception);
        }
    }

    private record ValidationBundleResource(
            List<ValidationDefinitionResource> definitions
    ) {
        private ValidationBundleResource {
            definitions = definitions == null ? List.of() : List.copyOf(definitions);
        }
    }

    private record ValidationDefinitionResource(
            String scenarioSlug,
            String validatorType,
            Map<String, Object> config,
            List<ValidationRuleResource> rules
    ) {

        private ValidationDefinitionResource {
            config = config == null ? Map.of() : Map.copyOf(config);
            rules = rules == null ? List.of() : List.copyOf(rules);
        }

        private AuthoredScenarioValidationLibrary.AuthoredScenarioValidationDefinition toDefinition() {
            return new AuthoredScenarioValidationLibrary.AuthoredScenarioValidationDefinition(
                    scenarioSlug,
                    validatorType,
                    config,
                    rules.stream()
                            .map(ValidationRuleResource::toRule)
                            .toList()
            );
        }
    }

    private record ValidationRuleResource(
            String rawCommand,
            String correctness,
            String code,
            String message
    ) {

        private ScenarioValidationRule toRule() {
            return new ScenarioValidationRule(
                    "exact_normalized_command",
                    rawCommand,
                    CommandTextNormalizer.normalize(rawCommand),
                    correctness,
                    code,
                    message
            );
        }
    }
}
