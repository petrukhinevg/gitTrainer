package com.example.gittrainer.scenario.api;

import com.example.gittrainer.scenario.application.BrowseScenarioCatalogUseCase;
import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.scenario.infrastructure.ScenarioCatalogSourceUnavailableException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
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
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String source
    ) {
        CatalogBrowseQuery query = new CatalogBrowseQuery(difficulty, tags, sort, source);
        return scenarioCatalogResponseMapper.toResponse(browseScenarioCatalogUseCase.browse(query));
    }

    @ExceptionHandler(ScenarioCatalogSourceUnavailableException.class)
    ProblemDetail handleUnavailableSource(ScenarioCatalogSourceUnavailableException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
    }
}
