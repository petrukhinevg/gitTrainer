# Backend Roadmap

## Goal

The backend must provide the domain model and source of truth for the Git training experience. It owns exercise definitions, session lifecycle, answer validation, hints, explanations, and progress tracking.

For the MVP, the backend should make it possible to serve a small scenario catalog, start a training session, validate a learner response, and return enough structured feedback for the frontend to render a useful explanation.

## Roadmap usage rules

- Items below should be suitable for creating issues.
- One task should produce a complete and testable backend result.
- If a backend item grows too large, convert it into a `parent issue` with `sub-issues`.

## MVP for backend

Backend MVP is complete when:

1. the backend can expose a catalog of Git exercises with metadata and step content
2. the backend can create and track a learner session for a selected exercise
3. the backend can validate submitted Git answers and return structured correctness feedback
4. the backend can store or at least consistently report attempt outcomes and completion status

## Parent issues

### Parent Issue 1. Scenario catalog domain

Goal: define the core backend model for Git exercises and make the initial catalog available to the application.

#### Sub-issue 1.1. Create scenario, step, and expected-outcome domain objects

Result: the backend has stable domain types for training content and validation targets.

#### Sub-issue 1.2. Model repository state snapshots for exercises

Result: backend scenarios can express starting branches, commits, file states, and other repository cues needed by the UI and validator.

#### Sub-issue 1.3. Add catalog loading strategy for MVP scenarios

Result: the application can serve a predefined set of exercises from local resources or in-memory fixtures.

#### Sub-issue 1.4. Seed status and branch scenarios in the catalog

Result: the application exposes a first small set of beginner exercises focused on repository inspection and branch flow.

#### Sub-issue 1.5. Seed history and conflict starter scenarios in the catalog

Result: the catalog covers the second MVP slice with commit history and basic conflict handling exercises.

### Parent Issue 2. Session lifecycle and validation

Goal: support an end-to-end attempt from exercise start to validated result.

#### Sub-issue 2.1. Create session start and submission APIs

Result: clients can start an exercise session and submit learner answers.

#### Sub-issue 2.2. Create session domain state and lifecycle rules

Result: the backend can track started, answered, solved, and failed session states consistently.

#### Sub-issue 2.3. Implement Git answer normalization for submitted commands

Result: the validator can compare learner input in a stable way without being overly sensitive to harmless formatting differences.

#### Sub-issue 2.4. Implement Git answer validation engine

Result: the backend can compare learner input against expected repository outcomes and return pass/fail reasons.

#### Sub-issue 2.5. Add structured validation failure codes

Result: clients receive machine-readable failure reasons that support consistent UI messaging and analytics.

### Parent Issue 3. Feedback and progress tracking

Goal: make backend responses useful for learning instead of simple status codes.

#### Sub-issue 3.1. Return explanation payloads for validation outcomes

Result: clients receive instructional feedback for incorrect or partial answers.

#### Sub-issue 3.2. Add progressive hint selection rules

Result: the backend can reveal stronger hints after repeated failures on the same scenario.

#### Sub-issue 3.3. Persist attempt history and completion state

Result: the backend stores attempt outcomes and solved status per scenario.

#### Sub-issue 3.4. Expose progress summary API

Result: clients can fetch completed exercises, recent attempts, and basic topic-level progress indicators.

#### Sub-issue 3.5. Add next-scenario recommendation rules

Result: the backend can suggest a reasonable follow-up exercise based on recent learner performance.
