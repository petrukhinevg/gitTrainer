# Backend Roadmap

## Goal

The backend must provide the domain model and source of truth for the Git training experience. It owns exercise definitions, session lifecycle, answer validation, hints, explanations, and progress tracking.

For the MVP, the backend should make it possible to serve a small scenario catalog, start a training session, validate a learner response, and return enough structured feedback for the frontend to render a useful explanation.

## Roadmap usage rules

- Items below should be suitable for creating issues.
- One task should produce a complete and testable backend result.
- If a backend item grows too large, convert it into a `parent issue` with `sub-issues`.
- Prefer issue sizes that can usually be implemented and reviewed in one focused PR.
- Prefer self-contained backend tasks that can branch from the epic baseline without requiring unmerged sibling backend code.

## MVP for backend

Backend MVP is complete when:

1. the backend can expose a catalog of Git exercises with metadata and step content
2. the backend can create and track a learner session for a selected exercise
3. the backend can validate submitted Git answers and return structured correctness feedback
4. the backend can store or at least consistently report attempt outcomes and completion status

## Parent issues

### Parent Issue 1. Scenario catalog browsing backend

Goal: provide the backend slice needed for browsing the first MVP catalog.

#### Sub-issue 1.1. Deliver catalog summary payloads for status and branch basics

Result: the backend can serve a browsable summary list for the first status and branch exercises from one stable boundary.

#### Sub-issue 1.2. Extend catalog summary coverage with history, rebase, and conflict starters

Result: the catalog summary boundary covers the second MVP scenario slice without redesigning the contract.

#### Sub-issue 1.3. Add catalog fields needed for frontend filtering and sorting

Result: the backend catalog output includes topic, difficulty, and other stable fields needed for filterable SPA lists.

### Parent Issue 2. Exercise context and workspace backend

Goal: provide the backend slice needed to open one exercise and show its context.

#### Sub-issue 2.1. Deliver scenario detail payloads for status and branch exercises

Result: the backend can return the full task description, ordered steps, and learner-facing explanation text for the first playable exercises.

#### Sub-issue 2.2. Deliver repository context payloads for status and branch exercises

Result: the backend can return repository cues such as branches, status hints, and file summaries for the first exercise slice.

#### Sub-issue 2.3. Extend scenario detail delivery with history and conflict context

Result: the scenario detail boundary also supports commit-history, rebase, and conflict starter exercises.

#### Sub-issue 2.4. Add a scenario-loading seam that can evolve beyond in-memory fixtures

Result: scenario detail consumers are insulated from whether data comes from code fixtures or future resource-backed sources.

### Parent Issue 3. Submission and correctness backend

Goal: provide the backend slice needed for answer submission and first-pass validation.

#### Sub-issue 3.1. Deliver session start and answer submission contracts for command-based exercises

Result: clients can start a session and submit an answer for the first command-based scenarios through one stable API shape.

#### Sub-issue 3.2. Validate single-command exercises and return structured pass or fail results

Result: the backend can judge the first command-based exercises and return a machine-readable correctness result.

#### Sub-issue 3.3. Validate multi-command and repository-state exercises

Result: the backend can judge more advanced exercises without changing the session and submission boundary.

### Parent Issue 4. Guided retry and hints backend

Goal: provide the backend slice needed for instructional retries.

#### Sub-issue 4.1. Return failure codes and explanation payloads for incorrect answers

Result: incorrect submissions produce structured feedback that the frontend can render as an explanation instead of a generic failure.

#### Sub-issue 4.2. Return partial-match feedback for near-correct answers

Result: the backend can distinguish close-but-incomplete answers from clearly incorrect ones.

#### Sub-issue 4.3. Add hint progression across repeated failures

Result: the backend can reveal progressively stronger hints without changing the submission contract.

### Parent Issue 5. Progress and next-step guidance backend

Goal: provide the backend slice needed for durable progress tracking and follow-up guidance.

#### Sub-issue 5.1. Persist attempt outcomes and per-scenario completion state

Result: the backend can report solved status and recent learner activity across restarts.

#### Sub-issue 5.2. Expose solved, in-progress, and recent-attempt data

Result: clients can fetch the progress markers needed for catalog badges, exercise headers, and recent activity views.

#### Sub-issue 5.3. Expose progress summary and next-scenario recommendation data

Result: clients can fetch both progress rollups and a sensible next exercise without re-deriving those decisions on the frontend.
