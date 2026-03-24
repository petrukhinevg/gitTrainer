package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioTaskContent;
import com.example.gittrainer.scenario.domain.ScenarioDifficulty;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class SeedScenarioResourceLoader {

    private static final String RESOURCE_PATH = "scenario/seed-scenarios.json";

    private final SeedScenarioCatalog defaultCatalog;
    private final Map<String, SeedScenarioItem> itemsBySlug;

    public SeedScenarioResourceLoader() {
        SeedScenarioBundle bundle = readBundle();
        this.defaultCatalog = new SeedScenarioCatalog(
                bundle.sourceName(),
                bundle.items().stream()
                        .map(SeedScenarioItem::toSummary)
                        .toList()
        );
        this.itemsBySlug = bundle.items().stream()
                .collect(java.util.stream.Collectors.toMap(
                        SeedScenarioItem::slug,
                        item -> item,
                        (left, right) -> right,
                        LinkedHashMap::new
                ));
    }

    public SeedScenarioCatalog defaultCatalog() {
        return defaultCatalog;
    }

    public ScenarioTaskContent taskContent(String scenarioSlug) {
        return requireItem(scenarioSlug).task();
    }

    public ScenarioWorkspaceDetail.ScenarioRepositoryContext repositoryContext(String scenarioSlug) {
        return requireItem(scenarioSlug).repositoryContext();
    }

    private SeedScenarioItem requireItem(String scenarioSlug) {
        SeedScenarioItem item = itemsBySlug.get(scenarioSlug);
        if (item == null) {
            throw new IllegalArgumentException("Scenario seed not found: " + scenarioSlug);
        }
        return item;
    }

    private SeedScenarioBundle readBundle() {
        ObjectMapper objectMapper = JsonMapper.builder()
                .findAndAddModules()
                .build();
        try (InputStream inputStream = new ClassPathResource(RESOURCE_PATH).getInputStream()) {
            return objectMapper.readValue(inputStream, SeedScenarioBundle.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Не удалось десериализовать scenario seed bundle.", exception);
        } catch (IOException exception) {
            throw new IllegalStateException("Не удалось загрузить scenario seed bundle.", exception);
        }
    }

    private record SeedScenarioBundle(
            String sourceName,
            List<SeedScenarioItem> items
    ) {
        private SeedScenarioBundle {
            items = items == null ? List.of() : List.copyOf(items);
        }
    }

    private record SeedScenarioItem(
            String id,
            String slug,
            String title,
            String summary,
            String difficulty,
            List<String> tags,
            ScenarioTaskContent task,
            ScenarioWorkspaceDetail.ScenarioRepositoryContext repositoryContext
    ) {

        private SeedScenarioItem {
            tags = tags == null ? List.of() : List.copyOf(tags);
        }

        private ScenarioSummary toSummary() {
            return new ScenarioSummary(
                    id,
                    slug,
                    title,
                    summary,
                    ScenarioDifficulty.valueOf(difficulty),
                    tags
            );
        }
    }
}
