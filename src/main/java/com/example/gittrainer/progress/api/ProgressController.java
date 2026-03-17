package com.example.gittrainer.progress.api;

import com.example.gittrainer.progress.application.LoadProgressSummaryUseCase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final LoadProgressSummaryUseCase loadProgressSummaryUseCase;
    private final ProgressSummaryResponseMapper progressSummaryResponseMapper;

    public ProgressController(
            LoadProgressSummaryUseCase loadProgressSummaryUseCase,
            ProgressSummaryResponseMapper progressSummaryResponseMapper
    ) {
        this.loadProgressSummaryUseCase = loadProgressSummaryUseCase;
        this.progressSummaryResponseMapper = progressSummaryResponseMapper;
    }

    @GetMapping
    public ProgressSummaryResponse loadProgressSummary() {
        return progressSummaryResponseMapper.toResponse(loadProgressSummaryUseCase.load());
    }
}
