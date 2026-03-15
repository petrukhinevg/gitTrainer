package com.example.gittrainer.scenario.api;

import com.example.gittrainer.scenario.application.BrowseScenarioCatalogUseCase;
import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.scenario.application.LoadScenarioDetailUseCase;
import com.example.gittrainer.scenario.application.ScenarioDetailNotFoundException;
import com.example.gittrainer.scenario.application.ScenarioRepositoryContextNotAuthoredException;
import com.example.gittrainer.scenario.domain.ScenarioDetailQuery;
import com.example.gittrainer.scenario.infrastructure.ScenarioCatalogSourceUnavailableException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/scenarios")
public class ScenarioCatalogController {

    private final BrowseScenarioCatalogUseCase browseScenarioCatalogUseCase;
    private final ScenarioCatalogResponseMapper scenarioCatalogResponseMapper;
    private final LoadScenarioDetailUseCase loadScenarioDetailUseCase;
    private final ScenarioDetailResponseMapper scenarioDetailResponseMapper;

    public ScenarioCatalogController(
            BrowseScenarioCatalogUseCase browseScenarioCatalogUseCase,
            ScenarioCatalogResponseMapper scenarioCatalogResponseMapper,
            LoadScenarioDetailUseCase loadScenarioDetailUseCase,
            ScenarioDetailResponseMapper scenarioDetailResponseMapper
    ) {
        this.browseScenarioCatalogUseCase = browseScenarioCatalogUseCase;
        this.scenarioCatalogResponseMapper = scenarioCatalogResponseMapper;
        this.loadScenarioDetailUseCase = loadScenarioDetailUseCase;
        this.scenarioDetailResponseMapper = scenarioDetailResponseMapper;
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

    @GetMapping("/{slug}")
    public ScenarioDetailResponse loadScenarioDetail(
            @PathVariable String slug,
            @RequestParam(required = false) String source
    ) {
        return scenarioDetailResponseMapper.toResponse(
                loadScenarioDetailUseCase.load(new ScenarioDetailQuery(slug, source))
        );
    }

    @ExceptionHandler(ScenarioCatalogSourceUnavailableException.class)
    ProblemDetail handleUnavailableSource(ScenarioCatalogSourceUnavailableException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
    }

    @ExceptionHandler(ScenarioDetailNotFoundException.class)
    ProblemDetail handleMissingScenarioDetail(ScenarioDetailNotFoundException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(ScenarioRepositoryContextNotAuthoredException.class)
    ProblemDetail handleMissingRepositoryContext(ScenarioRepositoryContextNotAuthoredException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage());
    }
}
