package com.example.gittrainer.session.api;

import com.example.gittrainer.session.application.InvalidSessionCommandException;
import com.example.gittrainer.session.application.StartTrainingSessionUseCase;
import com.example.gittrainer.session.application.SubmitTrainingSessionAnswerUseCase;
import com.example.gittrainer.session.application.TrainingSessionNotFoundException;
import com.example.gittrainer.session.domain.StartTrainingSessionCommand;
import com.example.gittrainer.session.domain.SubmitTrainingSessionAnswerCommand;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
public class TrainingSessionController {

    private final StartTrainingSessionUseCase startTrainingSessionUseCase;
    private final SubmitTrainingSessionAnswerUseCase submitTrainingSessionAnswerUseCase;
    private final SessionTransportResponseMapper sessionTransportResponseMapper;

    public TrainingSessionController(
            StartTrainingSessionUseCase startTrainingSessionUseCase,
            SubmitTrainingSessionAnswerUseCase submitTrainingSessionAnswerUseCase,
            SessionTransportResponseMapper sessionTransportResponseMapper
    ) {
        this.startTrainingSessionUseCase = startTrainingSessionUseCase;
        this.submitTrainingSessionAnswerUseCase = submitTrainingSessionAnswerUseCase;
        this.sessionTransportResponseMapper = sessionTransportResponseMapper;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SessionStartResponse startSession(@RequestBody SessionStartRequest request) {
        return sessionTransportResponseMapper.toStartResponse(
                startTrainingSessionUseCase.start(new StartTrainingSessionCommand(request.scenarioSlug()))
        );
    }

    @PostMapping("/{sessionId}/submissions")
    public SessionSubmissionResponse submitAnswer(
            @PathVariable String sessionId,
            @RequestBody SessionSubmissionRequest request
    ) {
        return sessionTransportResponseMapper.toSubmissionResponse(
                submitTrainingSessionAnswerUseCase.submit(new SubmitTrainingSessionAnswerCommand(sessionId, request.answer()))
        );
    }

    @ExceptionHandler(InvalidSessionCommandException.class)
    ProblemDetail handleInvalidCommand(InvalidSessionCommandException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(TrainingSessionNotFoundException.class)
    ProblemDetail handleSessionNotFound(TrainingSessionNotFoundException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }
}
