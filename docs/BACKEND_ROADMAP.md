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

#### Sub-issue 1.2. Add catalog loading strategy for MVP scenarios

Result: the application can serve a predefined set of exercises from local resources or in-memory fixtures.

### Parent Issue 2. Session lifecycle and validation

Goal: support an end-to-end attempt from exercise start to validated result.

#### Sub-issue 2.1. Create session start and submission APIs

Result: clients can start an exercise session and submit learner answers.

#### Sub-issue 2.2. Implement Git answer validation engine

Result: the backend can compare learner input against expected repository outcomes and return pass/fail reasons.

### Parent Issue 3. Feedback and progress tracking

Goal: make backend responses useful for learning instead of simple status codes.

#### Sub-issue 3.1. Return hints and explanation payloads

Result: clients receive instructional feedback for incorrect or partial answers.

#### Sub-issue 3.2. Persist progress and completion summaries

Result: the backend can report which exercises were attempted, solved, or repeatedly failed.
