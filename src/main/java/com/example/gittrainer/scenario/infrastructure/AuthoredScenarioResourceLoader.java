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
public class AuthoredScenarioResourceLoader {

    private static final String RESOURCE_PATH = "scenario/authored-scenarios.json";

    private final ScenarioCatalogFixture defaultCatalog;
    private final Map<String, AuthoredScenarioResourceItem> itemsBySlug;

    public AuthoredScenarioResourceLoader() {
        AuthoredScenarioResourceBundle bundle = readBundle();
        this.defaultCatalog = new ScenarioCatalogFixture(
                bundle.sourceName(),
                bundle.items().stream()
                        .map(AuthoredScenarioResourceItem::toSummary)
                        .toList()
        );
        this.itemsBySlug = bundle.items().stream()
                .collect(java.util.stream.Collectors.toMap(
                        AuthoredScenarioResourceItem::slug,
                        item -> item,
                        (left, right) -> right,
                        LinkedHashMap::new
                ));
    }

    public ScenarioCatalogFixture defaultCatalog() {
        return defaultCatalog;
    }

    public ScenarioTaskContent taskContent(String scenarioSlug) {
        return requireItem(scenarioSlug).task();
    }

    public ScenarioWorkspaceDetail.ScenarioRepositoryContext repositoryContext(String scenarioSlug) {
        return requireItem(scenarioSlug).repositoryContext();
    }

    private AuthoredScenarioResourceItem requireItem(String scenarioSlug) {
        AuthoredScenarioResourceItem item = itemsBySlug.get(scenarioSlug);
        if (item == null) {
            throw new IllegalArgumentException("Authored scenario resource not found: " + scenarioSlug);
        }
        return item;
    }

    private AuthoredScenarioResourceBundle readBundle() {
        ObjectMapper objectMapper = JsonMapper.builder()
                .findAndAddModules()
                .build();
        try (InputStream inputStream = new ClassPathResource(RESOURCE_PATH).getInputStream()) {
            return objectMapper.readValue(inputStream, AuthoredScenarioResourceBundle.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Не удалось десериализовать authored scenario resource bundle.", exception);
        } catch (IOException exception) {
            throw new IllegalStateException("Не удалось загрузить authored scenario resource bundle.", exception);
        }
    }

    private record AuthoredScenarioResourceBundle(
            String sourceName,
            List<AuthoredScenarioResourceItem> items
    ) {
        private AuthoredScenarioResourceBundle {
            items = items == null ? List.of() : List.copyOf(items);
        }
    }

    private record AuthoredScenarioResourceItem(
            String id,
            String slug,
            String title,
            String summary,
            String difficulty,
            List<String> tags,
            ScenarioTaskContent task,
            ScenarioWorkspaceDetail.ScenarioRepositoryContext repositoryContext
    ) {

        private AuthoredScenarioResourceItem {
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
