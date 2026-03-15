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
- The sub-issues below should stay task-ready: they should all be creatable immediately after the epic's initial baseline commit.
- If several backend sub-issues need the same minimal types, interfaces, or fixture schemas, place that seam in the initial epic commit rather than in a child task.
- Prefer splitting backend work by shell or boundary, policy or domain logic, and authored content or fixtures so sibling tasks can move in parallel from the same epic baseline.
- Prefer starting an epic with only the backend sub-issues that already have clear stable seams; split further later only where that improves parallelism or reviewability.
- Prefer backend sub-issues that align with frontend sub-issues for the same epic when both sides are implementing the same learner-facing slice.
- Backend-only sub-issues are valid when they deliver a complete backend capability, contract, content set, or policy without requiring unfinished sibling work.
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

#### Sub-issue 1.1. Deliver catalog browse API shell and deterministic stub boundary

Result: the backend exposes the catalog browse endpoint, request or response DTO mapping, and a deterministic stub adapter so the browse boundary is callable before real catalog content is wired.

Pairs with frontend sub-issue 1.1.

#### Sub-issue 1.2. Deliver catalog query policy for filtering and sorting

Result: the backend implements the MVP filtering, sorting, and empty-result behavior over the catalog summary model behind the browse boundary without depending on the authored scenario set.

Pairs with frontend sub-issue 1.2.

#### Sub-issue 1.3. Deliver MVP catalog summary content and browse-state fixtures

Result: the backend provides the initial scenario summary dataset plus source fixtures for normal, empty, and unavailable-source browse cases using the epic baseline fixture schema.

Pairs with frontend sub-issue 1.3.

### Parent Issue 2. Exercise context and workspace backend

Goal: provide the backend slice needed to open one exercise and show its context.

#### Sub-issue 2.1. Deliver exercise detail API shell and stub workspace payload

Result: the backend exposes the exercise detail endpoint, DTO mapping, and a deterministic stub workspace payload so the detail boundary is callable before authored scenario detail content is wired.

Pairs with frontend sub-issue 2.1.

#### Sub-issue 2.2. Deliver task-content structure and ordered-step assembly rules

Result: the backend defines and assembles learner-facing task content such as instructions, ordered steps, target goal text, and static workspace annotations behind the exercise detail model.

Pairs with frontend sub-issue 2.2.

#### Sub-issue 2.3. Deliver repository context schema and MVP scenario detail content

Result: the backend provides the repository context model and authored scenario detail content for MVP exercises, including branches, commit cues, file cues, and other static repository annotations.

Pairs with frontend sub-issue 2.3.

### Parent Issue 3. Submission and correctness backend

Goal: provide the backend slice needed for answer submission and first-pass validation.

#### Sub-issue 3.1. Deliver session lifecycle and submission transport boundary

Result: clients can start a session and submit an answer through a stable boundary that covers identifiers, lifecycle state, and transport-level success or failure handling with deterministic placeholder outcomes.

Backend-only supporting task for parent issue 3. Frontend transport work pairs through sub-issue 3.3 and correctness rendering pairs through sub-issue 3.2.

#### Sub-issue 3.2. Deliver first answer-type validation rules and outcome model

Result: the backend evaluates the first MVP answer types and produces a stable machine-readable outcome model that distinguishes correct, incorrect, partial if used, and unsupported-answer cases.

Pairs with frontend sub-issue 3.3.

#### Sub-issue 3.3. Deliver submission failure policy and unsupported-answer mappings

Result: the backend defines request failure behavior, retryable-versus-terminal submission errors, and unsupported-answer mappings so clients can render consistent failure feedback.

Pairs with frontend sub-issue 3.2.

### Parent Issue 4. Guided retry and hints backend

Goal: provide the backend slice needed for instructional retries.

#### Sub-issue 4.1. Deliver retry state model and retry eligibility policy

Result: the backend defines the retry state model, retry counters, and eligibility rules that determine whether another attempt or a stronger hint is available after a failed submission.

Pairs with frontend sub-issue 4.1.

#### Sub-issue 4.2. Deliver explanation selection and progressive hint policy

Result: the backend defines instructional explanation selection and hint progression rules for incorrect and partial answers across the MVP scenarios.

Pairs with frontend sub-issue 4.2.

#### Sub-issue 4.3. Deliver retry feedback payload assembly and boundary mapping

Result: the backend exposes the retry feedback boundary that assembles attempt state, explanation content, hint level, and retry eligibility into a stable payload after failed submissions.

Pairs with frontend sub-issue 4.3.

### Parent Issue 5. Progress and next-step guidance backend

Goal: provide the backend slice needed for durable progress tracking and follow-up guidance.

#### Sub-issue 5.1. Deliver attempt outcome storage model and completion event recording

Result: the backend defines how attempt outcomes, completion events, and in-progress state are recorded so later progress queries and recommendations have a stable source of truth.

Backend-only supporting task for parent issue 5. User-facing frontend progress work pairs through sub-issues 5.2 and 5.3.

#### Sub-issue 5.2. Deliver progress summary contract and status derivation rules

Result: the backend exposes the progress summary boundary and derives completion markers, in-progress status, and recent activity from the recorded attempt history.

Pairs with frontend sub-issue 5.2.

#### Sub-issue 5.3. Deliver next-step recommendation policy and payload mapping

Result: the backend defines how solved, attempted, and next suggested exercises are derived and exposes the recommendation payload needed for follow-up guidance in the MVP.

Pairs with frontend sub-issue 5.3.
