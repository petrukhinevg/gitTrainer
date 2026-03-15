package com.example.gittrainer.scenario.api;

import com.example.gittrainer.scenario.application.ListScenarioCatalogUseCase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/scenarios")
public class ScenarioCatalogController {

    private final ListScenarioCatalogUseCase listScenarioCatalogUseCase;

    public ScenarioCatalogController(ListScenarioCatalogUseCase listScenarioCatalogUseCase) {
        this.listScenarioCatalogUseCase = listScenarioCatalogUseCase;
    }

    @GetMapping
    public ScenarioCatalogResponse listScenarios() {
        return new ScenarioCatalogResponse(
                listScenarioCatalogUseCase.listSummaries().stream()
                        .map(summary -> new ScenarioCatalogSummaryResponse(
                                summary.id(),
                                summary.title(),
                                summary.summary(),
                                summary.topic().name(),
                                summary.difficulty().name(),
                                summary.catalogOrder(),
                                summary.estimatedMinutes()
                        ))
                        .collect(Collectors.toList())
        );
    }
}
