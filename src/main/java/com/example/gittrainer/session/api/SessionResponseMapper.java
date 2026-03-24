package com.example.gittrainer.session.api;

import com.example.gittrainer.session.application.SessionWorkspaceSnapshot;
import com.example.gittrainer.session.application.SessionWorkspaceSnapshotReader;
import com.example.gittrainer.session.application.StartSessionResult;
import com.example.gittrainer.session.application.SubmitAnswerResult;
import com.example.gittrainer.session.domain.TrainingSession;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class SessionResponseMapper {

    private final SessionRetryFeedbackFactory sessionRetryFeedbackFactory;
    private final SessionWorkspaceSnapshotReader sessionWorkspaceSnapshotReader;

    public SessionResponseMapper(
            SessionRetryFeedbackFactory sessionRetryFeedbackFactory,
            SessionWorkspaceSnapshotReader sessionWorkspaceSnapshotReader
    ) {
        this.sessionRetryFeedbackFactory = sessionRetryFeedbackFactory;
        this.sessionWorkspaceSnapshotReader = sessionWorkspaceSnapshotReader;
    }

    public SessionStartResponse toStartResponse(StartSessionResult result) {
        return new SessionStartResponse(
                result.session().sessionId(),
                new SessionScenarioResponse(
                        result.session().scenarioSlug(),
                        result.session().scenarioTitle(),
                        result.session().scenarioSource()
                ),
                toLifecycleResponse(result.session()),
                new SessionSubmissionBoundaryResponse(
                        result.supportedAnswerTypes(),
                        toOutcomeResponse(result.placeholderOutcome()),
                        sessionRetryFeedbackFactory.toResponse(
                                result.retryState(),
                                null,
                                result.placeholderOutcome(),
                                null
                        )
                ),
                toWorkspaceResponse(result.session())
        );
    }

    public SessionSubmissionResponse toSubmissionResponse(SubmitAnswerResult result) {
        return new SessionSubmissionResponse(
                result.submissionId(),
                result.session().sessionId(),
                result.attemptNumber(),
                result.submittedAt(),
                toLifecycleResponse(result.session()),
                new SubmittedAnswerResponse(result.answer().type(), result.answer().value()),
                toOutcomeResponse(result.outcome()),
                sessionRetryFeedbackFactory.toResponse(
                        result.retryState(),
                        result.retryGuidance(),
                        result.outcome(),
                        result.answer().value()
                ),
                toWorkspaceResponse(result.session())
        );
    }

    private SessionLifecycleResponse toLifecycleResponse(TrainingSession session) {
        return new SessionLifecycleResponse(
                session.state().name().toLowerCase(Locale.ROOT),
                session.startedAt(),
                session.submissionCount(),
                session.lastSubmissionId()
        );
    }

    private SubmissionOutcomeResponse toOutcomeResponse(SubmissionOutcome outcome) {
        return new SubmissionOutcomeResponse(
                outcome.status(),
                outcome.correctness(),
                outcome.code(),
                outcome.message()
        );
    }

    private SessionWorkspaceResponse toWorkspaceResponse(TrainingSession session) {
        return sessionWorkspaceSnapshotReader.read(session.sessionId())
                .map(SessionResponseMapper::toWorkspaceResponse)
                .orElse(null);
    }

    private static SessionWorkspaceResponse toWorkspaceResponse(SessionWorkspaceSnapshot snapshot) {
        SessionWorkspaceSnapshot.RepositoryContext repositoryContext = snapshot.repositoryContext();
        return new SessionWorkspaceResponse(
                new SessionRepositoryContextResponse(
                        repositoryContext.status(),
                        repositoryContext.branches().stream()
                                .map(branch -> new SessionRepositoryBranchResponse(branch.name(), branch.current()))
                                .toList(),
                        repositoryContext.commits().stream()
                                .map(commit -> new SessionRepositoryCommitResponse(commit.id(), commit.summary()))
                                .toList(),
                        repositoryContext.files().stream()
                                .map(file -> new SessionRepositoryFileResponse(file.path(), file.status()))
                                .toList(),
                        repositoryContext.annotations().stream()
                                .map(annotation -> new SessionWorkspaceAnnotationResponse(
                                        annotation.label(),
                                        annotation.message()
                                ))
                                .toList(),
                        toCommitGraphResponse(repositoryContext)
                )
        );
    }

    private static SessionCommitGraphResponse toCommitGraphResponse(SessionWorkspaceSnapshot.RepositoryContext context) {
        SessionWorkspaceSnapshot.CommitGraph graph = context.graph() != null
                ? context.graph()
                : synthesizeGraph(context);
        return new SessionCommitGraphResponse(
                graph.nodes().stream()
                        .map(node -> new SessionCommitNodeResponse(
                                node.id(),
                                node.summary(),
                                node.parentIds(),
                                node.refs().stream()
                                        .map(ref -> new SessionCommitRefResponse(
                                                ref.name(),
                                                ref.type(),
                                                ref.current()
                                        ))
                                        .toList()
                        ))
                        .toList()
        );
    }

    private static SessionWorkspaceSnapshot.CommitGraph synthesizeGraph(SessionWorkspaceSnapshot.RepositoryContext context) {
        java.util.List<SessionWorkspaceSnapshot.Commit> commits = context.commits();
        if (commits.isEmpty()) {
            return new SessionWorkspaceSnapshot.CommitGraph(java.util.List.of());
        }

        java.util.List<SessionWorkspaceSnapshot.CommitNode> nodes = new java.util.ArrayList<>();
        for (int index = 0; index < commits.size(); index++) {
            SessionWorkspaceSnapshot.Commit commit = commits.get(index);
            java.util.List<String> parentIds = index + 1 < commits.size()
                    ? java.util.List.of(commits.get(index + 1).id())
                    : java.util.List.of();
            java.util.List<SessionWorkspaceSnapshot.CommitRef> refs = index == 0
                    ? context.branches().stream()
                            .map(branch -> new SessionWorkspaceSnapshot.CommitRef(
                                    branch.name(),
                                    branch.name().startsWith("origin/") ? "remote" : "branch",
                                    branch.current()
                            ))
                            .toList()
                    : java.util.List.of();
            nodes.add(new SessionWorkspaceSnapshot.CommitNode(
                    commit.id(),
                    commit.summary(),
                    parentIds,
                    refs
            ));
        }
        return new SessionWorkspaceSnapshot.CommitGraph(nodes);
    }
}
