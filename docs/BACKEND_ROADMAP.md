# Backend Roadmap

## Goal

The backend must provide the domain model and source of truth for the Git training experience. It owns exercise definitions, session lifecycle, answer validation, hints, explanations, and progress tracking.

For the MVP, the backend should make it possible to serve a small scenario catalog, start a training session, validate a learner response, and return enough structured feedback for the frontend to render a useful explanation.

## Roadmap usage rules

- Items below should be suitable for creating issues.
- One task should produce a complete and testable backend result.
- If a backend item grows too large, convert it into a `parent issue` with `sub-issues`.
- Prefer issue sizes that can usually be implemented and reviewed in one focused PR.

## MVP for backend

Backend MVP is complete when:

1. the backend can expose a catalog of Git exercises with metadata and step content
2. the backend can create and track a learner session for a selected exercise
3. the backend can validate submitted Git answers and return structured correctness feedback
4. the backend can store or at least consistently report attempt outcomes and completion status

## Parent issues

### Parent Issue 1. Scenario catalog domain

Goal: define the core backend model for Git exercises and make the initial catalog available to the application.

#### Sub-issue 1.1. Create scenario identity and metadata objects

Result: the backend can represent scenario id, title, topic, difficulty, and summary metadata consistently.

#### Sub-issue 1.2. Create exercise step and instructional content objects

Result: the backend can represent ordered exercise steps, learner instructions, and explanation text.

#### Sub-issue 1.3. Model expected-outcome objects for validation targets

Result: scenarios can express machine-checkable success targets without yet modeling full repository snapshots.

#### Sub-issue 1.4. Model repository state snapshot objects

Result: backend scenarios can express starting branches, commits, file states, and other repository cues needed by the UI and validator.

#### Sub-issue 1.5. Assemble scenario aggregate rules

Result: the backend can validate that a scenario contains the required metadata, state, steps, and outcome parts.

#### Sub-issue 1.6. Add in-memory catalog loading for MVP scenarios

Result: the application can serve a predefined set of exercises from code or fixtures.

#### Sub-issue 1.7. Add resource-backed catalog loading seam

Result: the catalog can evolve from pure in-memory seeding to loadable resources without rewriting the application boundary.

#### Sub-issue 1.8. Seed status inspection scenarios in the catalog

Result: the application exposes beginner exercises focused on repository inspection.

#### Sub-issue 1.9. Seed branch creation and switching scenarios in the catalog

Result: the catalog covers the first branch-flow exercises for the MVP.

#### Sub-issue 1.10. Seed history inspection scenarios in the catalog

Result: the catalog includes exercises focused on reading commit history and log output.

#### Sub-issue 1.11. Seed rebase starter scenarios in the catalog

Result: the catalog covers introductory history-rewrite exercises at MVP scope.

#### Sub-issue 1.12. Seed conflict-resolution starter scenarios in the catalog

Result: the catalog includes the first exercises that teach resolving basic merge or rebase conflicts.

### Parent Issue 2. Session lifecycle and validation

Goal: support an end-to-end attempt from exercise start to validated result.

#### Sub-issue 2.1. Create session identity and core state objects

Result: the backend can represent a learner attempt with stable identifiers and base session fields.

#### Sub-issue 2.2. Define session lifecycle transitions

Result: the backend can track started, answered, solved, and failed session states consistently.

#### Sub-issue 2.3. Create session start API contract

Result: clients and backend share a clear request and response shape for starting an exercise attempt.

#### Sub-issue 2.4. Create answer submission API contract

Result: clients and backend share a clear request and response shape for submitting learner answers.

#### Sub-issue 2.5. Implement session start application flow

Result: the backend can open a session for a selected scenario and return its initial state.

#### Sub-issue 2.6. Implement answer normalization for submitted Git commands

Result: the validator can compare learner input in a stable way without being overly sensitive to harmless formatting differences.

#### Sub-issue 2.7. Validate command-form answers against expected commands

Result: the backend can check structured command answers where exact or normalized command intent is the target.

#### Sub-issue 2.8. Validate state-based answers against expected outcomes

Result: the backend can compare learner input against repository-state success targets.

#### Sub-issue 2.9. Add structured validation result model

Result: validation outcomes can express pass, fail, and partial-match states consistently.

#### Sub-issue 2.10. Add structured validation failure codes

Result: clients receive machine-readable failure reasons that support consistent UI messaging and analytics.

#### Sub-issue 2.11. Implement answer submission application flow

Result: the backend can accept a learner answer, run validation, and update session state in one use case.

### Parent Issue 3. Feedback and progress tracking

Goal: make backend responses useful for learning instead of simple status codes.

#### Sub-issue 3.1. Define explanation payload model

Result: backend responses can carry structured instructional feedback instead of plain status text.

#### Sub-issue 3.2. Return explanation payloads for incorrect answers

Result: clients receive instructional feedback for failed validation outcomes.

#### Sub-issue 3.3. Return explanation payloads for partial matches

Result: clients receive targeted guidance when an answer is close but incomplete.

#### Sub-issue 3.4. Define hint progression state

Result: the backend can track which hint level should be revealed for a session.

#### Sub-issue 3.5. Add progressive hint selection rules

Result: the backend can reveal stronger hints after repeated failures on the same scenario.

#### Sub-issue 3.6. Persist session outcomes

Result: the backend stores validation results and status transitions for learner attempts.

#### Sub-issue 3.7. Persist per-scenario completion state

Result: the backend can report whether a learner has solved a scenario independent of transient session state.

#### Sub-issue 3.8. Expose solved and in-progress scenario status API

Result: clients can fetch completion and in-progress markers for scenario lists and headers.

#### Sub-issue 3.9. Expose recent attempts API

Result: clients can fetch the learner's most recent activity without reconstructing it on the frontend.

#### Sub-issue 3.10. Expose progress summary API

Result: clients can fetch completed exercises, recent attempts, and basic topic-level progress indicators.

#### Sub-issue 3.11. Add next-scenario recommendation rules

Result: the backend can suggest a reasonable follow-up exercise based on recent learner performance.
