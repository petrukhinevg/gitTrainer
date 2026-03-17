package com.example.gittrainer.session.application;

import com.example.gittrainer.progress.application.ProgressRepository;
import com.example.gittrainer.progress.domain.ScenarioProgressRecord;
import com.example.gittrainer.session.domain.TrainingSession;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.annotation.DirtiesContext;

import java.util.List;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class SubmitAnswerUseCaseConcurrencyTest {

    @Autowired
    private StartSessionUseCase startSessionUseCase;

    @Autowired
    private SubmitAnswerUseCase submitAnswerUseCase;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private ProgressRepository progressRepository;

    @Test
    void recordsConcurrentSubmissionsWithoutLosingAttemptIncrements() throws Exception {
        StartSessionResult startedSession = startSessionUseCase.start(new StartSessionCommand("status-basics", null));
        String sessionId = startedSession.session().sessionId();
        int concurrentSubmissions = 6;

        CountDownLatch startLatch = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(concurrentSubmissions);

        try {
            List<Callable<SubmitAnswerResult>> tasks = IntStream.range(0, concurrentSubmissions)
                    .<Callable<SubmitAnswerResult>>mapToObj(ignored -> () -> {
                        assertThat(startLatch.await(5, TimeUnit.SECONDS)).isTrue();
                        return submitAnswerUseCase.submit(
                                sessionId,
                                new SubmitAnswerCommand("command_text", "git status")
                        );
                    })
                    .toList();

            List<Future<SubmitAnswerResult>> futures = tasks.stream()
                    .map(executor::submit)
                    .toList();

            startLatch.countDown();

            List<SubmitAnswerResult> results = futures.stream()
                    .map(this::awaitResult)
                    .toList();

            assertThat(results)
                    .extracting(SubmitAnswerResult::attemptNumber)
                    .containsExactlyInAnyOrderElementsOf(IntStream.rangeClosed(1, concurrentSubmissions).boxed().toList());

            Set<String> submissionIds = results.stream()
                    .map(SubmitAnswerResult::submissionId)
                    .collect(Collectors.toSet());
            assertThat(submissionIds).hasSize(concurrentSubmissions);

            TrainingSession persistedSession = sessionRepository.findById(sessionId).orElseThrow();
            assertThat(persistedSession.submissionCount()).isEqualTo(concurrentSubmissions);
            assertThat(submissionIds).contains(persistedSession.lastSubmissionId());

            ScenarioProgressRecord progressRecord = progressRepository.findByScenarioSlug(startedSession.session().scenarioSlug())
                    .orElseThrow();
            assertThat(progressRecord.attemptCount()).isEqualTo(concurrentSubmissions);
            assertThat(progressRecord.lastSubmissionId()).isIn(submissionIds);
        } finally {
            executor.shutdownNow();
        }
    }

    private SubmitAnswerResult awaitResult(Future<SubmitAnswerResult> future) {
        try {
            return future.get(5, TimeUnit.SECONDS);
        } catch (Exception exception) {
            throw new AssertionError("Concurrent submission task failed.", exception);
        }
    }
}
