package com.example.gittrainer.scenario.api;

import com.example.gittrainer.scenario.application.BrowseScenarioCatalogUseCase;
import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/scenarios")
public class ScenarioCatalogController {

    private final BrowseScenarioCatalogUseCase browseScenarioCatalogUseCase;
    private final ScenarioCatalogResponseMapper scenarioCatalogResponseMapper;

    public ScenarioCatalogController(
            BrowseScenarioCatalogUseCase browseScenarioCatalogUseCase,
            ScenarioCatalogResponseMapper scenarioCatalogResponseMapper
    ) {
        this.browseScenarioCatalogUseCase = browseScenarioCatalogUseCase;
        this.scenarioCatalogResponseMapper = scenarioCatalogResponseMapper;
    }

    @GetMapping
    public ScenarioCatalogResponse browseScenarios(
            @RequestParam(required = false) String difficulty,
            @RequestParam(name = "tag", required = false) List<String> tags,
            @RequestParam(required = false) String sort
    ) {
        CatalogBrowseQuery query = new CatalogBrowseQuery(difficulty, tags, sort);
        return scenarioCatalogResponseMapper.toResponse(browseScenarioCatalogUseCase.browse(query));
    }
}
