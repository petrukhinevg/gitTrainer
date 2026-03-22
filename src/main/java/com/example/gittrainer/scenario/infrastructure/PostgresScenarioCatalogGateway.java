package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioCatalogGateway;
import com.example.gittrainer.scenario.application.ScenarioSourceUnavailableException;
import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.scenario.domain.ScenarioDifficulty;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Locale;

@Primary
@Component
@Profile("!test & !local-memory")
public class PostgresScenarioCatalogGateway implements ScenarioCatalogGateway {

    private static final String DEFAULT_SOURCE_KEY = "default";
    private static final String DEFAULT_SOURCE_NAME = "mvp-fixture";
    private static final String EMPTY_SOURCE_NAME = "mvp-fixture-empty";
    private static final String UNAVAILABLE_SOURCE_NAME = "mvp-fixture-unavailable";

    private final JdbcClient jdbcClient;
    private final AuthoredScenarioJsonMapper jsonMapper;

    public PostgresScenarioCatalogGateway(JdbcClient jdbcClient, AuthoredScenarioJsonMapper jsonMapper) {
        this.jdbcClient = jdbcClient;
        this.jsonMapper = jsonMapper;
    }

    @Override
    public List<ScenarioSummary> loadCatalog(CatalogBrowseQuery query) {
        SourceSelection sourceSelection = SourceSelection.from(query.source());
        if (sourceSelection.empty()) {
            return List.of();
        }
        if (sourceSelection.unavailable()) {
            throw new ScenarioSourceUnavailableException(
                    UNAVAILABLE_SOURCE_NAME,
                    "Источник каталога сейчас недоступен. Выберите другой источник или повторите позже."
            );
        }

        return jdbcClient.sql("""
                        SELECT scenario_slug,
                               scenario_id,
                               title,
                               summary,
                               difficulty,
                               tags_json
                        FROM authored_scenarios
                        WHERE enabled = TRUE
                          AND source_key = ?
                        ORDER BY title
                        """)
                .param(sourceSelection.sourceKey())
                .query(this::mapSummary)
                .list();
    }

    @Override
    public String sourceName(CatalogBrowseQuery query) {
        SourceSelection sourceSelection = SourceSelection.from(query.source());
        if (sourceSelection.empty()) {
            return EMPTY_SOURCE_NAME;
        }
        if (sourceSelection.unavailable()) {
            throw new ScenarioSourceUnavailableException(
                    UNAVAILABLE_SOURCE_NAME,
                    "Источник каталога сейчас недоступен. Выберите другой источник или повторите позже."
            );
        }

        return jdbcClient.sql("""
                        SELECT source_name
                        FROM authored_scenarios
                        WHERE enabled = TRUE
                          AND source_key = ?
                        ORDER BY title
                        LIMIT 1
                        """)
                .param(sourceSelection.sourceKey())
                .query(String.class)
                .optional()
                .orElse(sourceSelection.fallbackSourceName());
    }

    private ScenarioSummary mapSummary(ResultSet resultSet, int rowNum) throws SQLException {
        return new ScenarioSummary(
                resultSet.getString("scenario_id"),
                resultSet.getString("scenario_slug"),
                resultSet.getString("title"),
                resultSet.getString("summary"),
                ScenarioDifficulty.valueOf(resultSet.getString("difficulty")),
                jsonMapper.readTags(resultSet.getString("tags_json"))
        );
    }

    private record SourceSelection(
            String sourceKey,
            boolean empty,
            boolean unavailable,
            String fallbackSourceName
    ) {

        private static SourceSelection from(String rawSource) {
            String normalizedSource = rawSource == null ? null : rawSource.trim();
            if (normalizedSource == null
                    || normalizedSource.isBlank()
                    || "default".equalsIgnoreCase(normalizedSource)) {
                return new SourceSelection(DEFAULT_SOURCE_KEY, false, false, DEFAULT_SOURCE_NAME);
            }

            String normalized = normalizedSource.toLowerCase(Locale.ROOT);
            if ("empty".equals(normalized)) {
                return new SourceSelection(DEFAULT_SOURCE_KEY, true, false, EMPTY_SOURCE_NAME);
            }
            if ("unavailable".equals(normalized)) {
                return new SourceSelection(DEFAULT_SOURCE_KEY, false, true, UNAVAILABLE_SOURCE_NAME);
            }

            return new SourceSelection(normalized, false, false, normalized);
        }
    }
}
