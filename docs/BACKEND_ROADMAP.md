# Backend Roadmap

## Goal

The backend must provide the domain model and source of truth for the Git training experience. It owns exercise definitions, session lifecycle, answer validation, hints, explanations, and progress tracking.

For the MVP, the backend should make it possible to serve a small scenario catalog, start a training session, validate a learner response, and return enough structured feedback for the frontend to render a useful explanation.

## Roadmap usage rules

- Items below should be suitable for creating issues.
- One task should produce a complete and testable backend result.
- If a backend item grows too large, convert it into a `parent issue` with `sub-issues`.
- Prefer issue sizes that can usually be implemented and reviewed in one focused PR.
- Prefer self-contained backend tasks that can branch from the parent baseline without requiring unmerged sibling backend code.
- If two backend steps only become meaningful together as one stable contract, merge them into one broader backend task instead of chaining sibling tasks.

## MVP for backend

Backend MVP is complete when:

1. the backend can expose a catalog of Git exercises with metadata and step content
2. the backend can create and track a learner session for a selected exercise
3. the backend can validate submitted Git answers and return structured correctness feedback
4. the backend can store or at least consistently report attempt outcomes and completion status

## Parent issues

### Parent Issue 1. Scenario catalog browsing backend

Goal: provide the backend slice needed for browsing the first MVP catalog.

#### Sub-issue 1.1. Deliver complete catalog summary boundary for MVP browsing

Result: the backend exposes one stable catalog summary boundary for the full MVP scenario set, including the fields needed for filtering and sorting.

### Parent Issue 2. Exercise context and workspace backend

Goal: provide the backend slice needed to open one exercise and show its context.

#### Sub-issue 2.1. Deliver complete exercise detail and repository context boundary

Result: the backend exposes one stable exercise detail boundary for the MVP scenario set, including learner-facing task text, ordered steps, repository context, and any required data-source seam.

### Parent Issue 3. Submission and correctness backend

Goal: provide the backend slice needed for answer submission and first-pass validation.

#### Sub-issue 3.1. Deliver complete submission and correctness boundary for MVP answer types

Result: clients can start a session, submit the first MVP answer types, and receive stable machine-readable correctness results through one backend boundary.

### Parent Issue 4. Guided retry and hints backend

Goal: provide the backend slice needed for instructional retries.

#### Sub-issue 4.1. Deliver explanation and hint progression boundary

Result: the backend exposes one stable instructional feedback boundary that covers incorrect answers, partial matches, and progressive hints.

### Parent Issue 5. Progress and next-step guidance backend

Goal: provide the backend slice needed for durable progress tracking and follow-up guidance.

#### Sub-issue 5.1. Deliver progress and recommendation boundary

Result: the backend exposes one stable progress boundary for completion state, recent activity, progress summaries, and next-step recommendations.
