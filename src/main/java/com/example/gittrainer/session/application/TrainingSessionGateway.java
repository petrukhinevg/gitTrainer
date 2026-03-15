package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.StartTrainingSessionCommand;
import com.example.gittrainer.session.domain.SubmitTrainingSessionAnswerCommand;

public interface TrainingSessionGateway {

    StartedTrainingSession startSession(StartTrainingSessionCommand command);

    SubmissionReceipt submitAnswer(SubmitTrainingSessionAnswerCommand command);
}
