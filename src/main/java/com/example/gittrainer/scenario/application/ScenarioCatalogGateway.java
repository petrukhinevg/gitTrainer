package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.scenario.domain.ScenarioSummary;

import java.util.List;

public interface ScenarioCatalogGateway {

    List<ScenarioSummary> loadCatalog(CatalogBrowseQuery query);

    String sourceName();
}
