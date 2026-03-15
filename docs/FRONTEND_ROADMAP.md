# Frontend Roadmap

## Goal

The frontend must provide a focused single-page training experience where learners move from scenario selection to solving Git tasks without page reloads or context loss. It should make repository state, expected task goal, current answer, and feedback easy to compare on one screen.

For the MVP, the frontend should enable a learner to browse exercises, enter a training session, submit an answer, and understand the result through clear feedback and progress cues.

## Roadmap usage rules

- Items below should be suitable for creating issues.
- One task should produce a complete and testable frontend result.
- If a frontend item grows too large, convert it into a `parent issue` with `sub-issues`.
- Prefer issue sizes that can usually be implemented and reviewed in one focused PR.
- Prefer self-contained frontend tasks that can move forward from fixtures or stable contracts without waiting on unmerged sibling frontend work.
- The sub-issues below should stay task-ready: they should all be creatable immediately after the epic's initial baseline commit.
- If several frontend sub-issues need the same minimal route placeholders, provider interfaces, props shapes, or fixture schemas, place that seam in the initial epic commit rather than in a child task.
- Prefer splitting frontend work by shell or screen state, presentation surfaces, and provider or transport integration so sibling tasks can move in parallel from the same epic baseline.
- Prefer starting an epic with only the frontend sub-issues that already have clear UI or state seams; split further later only where that improves parallelism or reviewability.
- Prefer frontend sub-issues that align with backend sub-issues for the same epic when both sides are implementing the same learner-facing slice.
- Frontend-only sub-issues are valid when they deliver a complete UI state, presentation surface, or interaction loop against a stable or swappable provider seam.
- If several frontend steps are only meaningful together as one screen or one interaction loop, keep them in one broader frontend task instead of chaining sibling tasks.

## Base UI constraints

- application type: SPA
- main work surface: training workspace with scenario panel, answer input area, and validation feedback panel
- responsive targets: desktop first, usable on tablet, basic support on mobile for reading and light interaction
- visual or accessibility constraints: keyboard-friendly input flow, high-contrast status states, no feedback conveyed by color alone, readable Git command typography

## MVP for frontend

Frontend MVP is complete when:

1. the learner can browse and filter the Git exercise catalog in one SPA flow
2. the learner can open an exercise and see task description, repository context, and answer input controls
3. the learner can submit an answer and receive clear validation feedback without leaving the page
4. the learner can see which exercises were completed and what to practice next

## Parent issues

### Parent Issue 1. Scenario catalog browsing frontend

Goal: provide the frontend slice needed for browsing and choosing exercises.

#### Sub-issue 1.1. Deliver catalog route shell and swappable provider seam

Result: the frontend provides the catalog route shell, screen-level state boundary, and a swappable provider seam with local fixtures so catalog work can proceed without waiting on live backend integration.

Pairs with backend sub-issue 1.1.

#### Sub-issue 1.2. Deliver catalog query controls and browse-state handling

Result: the frontend handles initial load, filtering, sorting, empty results, loading, and unavailable-source states through the catalog screen state model without depending on final list presentation details.

Pairs with backend sub-issue 1.2.

#### Sub-issue 1.3. Deliver catalog list rendering and entry-action presentation

Result: the frontend renders scenario summary cards or rows, tags, difficulty cues, and entry actions against the catalog provider seam without changing the screen state contract.

Pairs with backend sub-issue 1.3.

### Parent Issue 2. Exercise context and workspace frontend

Goal: provide the frontend slice needed to open an exercise and understand its context.

#### Sub-issue 2.1. Deliver exercise route, workspace shell, and swappable detail provider seam

Result: the frontend wires exercise routing, load or error flow, and a swappable detail provider seam with local fixtures, delivering the stable workspace shell before final content rendering is complete.

Pairs with backend sub-issue 2.1.

#### Sub-issue 2.2. Deliver task instruction and ordered-step presentation

Result: the frontend renders task goal text, instructions, ordered steps, and static workspace annotations from the workspace payload without depending on repository context visuals.

Pairs with backend sub-issue 2.2.

#### Sub-issue 2.3. Deliver repository context presentation surfaces

Result: the frontend renders repository context cues such as branches, commits, files, and annotations using the workspace payload without redesigning the shell.

Pairs with backend sub-issue 2.3.

#### Sub-issue 2.4. Refactor workspace shell into a stable three-column lesson layout

Result: the frontend reshapes the exercise screen into a desktop-first three-column layout with dedicated left navigation, center lesson, and right practice lanes while preserving the existing route and provider boundaries.

Frontend-only follow-up task for parent issue 2 after the initial workspace shell and repository-context surfaces are already in place.

#### Sub-issue 2.5. Deliver lesson-navigation rail and focused center lesson presentation

Result: the frontend turns the left lane into a level or lesson navigator and focuses the center lane on the active task description so the learner can scan progression and instructions without the practice lane competing for space.

Frontend-only follow-up task for parent issue 2 that builds on the existing workspace payload and shell seams.

### Parent Issue 3. Submission and correctness frontend

Goal: provide the frontend slice needed for answer submission and first-pass correctness feedback.

#### Sub-issue 3.1. Deliver answer input shell and local draft-state flow

Result: the frontend delivers answer input controls, local draft state, and submission-ready form behavior without depending on live transport or final correctness rendering.

Frontend-only supporting task for parent issue 3. Backend pairing starts at transport and correctness slices in sub-issues 3.2 and 3.3.

#### Sub-issue 3.2. Deliver submission transport integration and request-state handling

Result: the frontend integrates session bootstrap and answer submission with a swappable provider, including pending, retryable request failure, and terminal request failure states.

Pairs with backend sub-issue 3.3.

#### Sub-issue 3.3. Deliver correctness and unsupported-answer feedback rendering

Result: the frontend renders machine-readable correctness outcomes for the first MVP answer types, including correct, incorrect, and unsupported-answer cases, without changing the answer input shell.

Pairs with backend sub-issue 3.2.

#### Sub-issue 3.4. Refactor the right workspace lane into a practice surface with input and branch-state output

Result: the frontend turns the right lane into a practice-focused surface that combines answer entry with visible Git branch state or execution output scaffolding, without requiring the final validation loop to be complete.

Frontend-only follow-up task for parent issue 3 that extends the answer-input shell into the target practice layout.

### Parent Issue 4. Guided retry and hints frontend

Goal: provide the frontend slice needed for instructional retries.

#### Sub-issue 4.1. Deliver feedback panel shell and preserved exercise context state

Result: the frontend provides the feedback panel shell and preserves active exercise context after failed submissions without depending on the final explanation or transport details.

Pairs with backend sub-issue 4.1.

#### Sub-issue 4.2. Deliver explanation rendering and progressive hint interactions

Result: the frontend renders instructional explanations, partial-match messaging, and progressive hint reveal behavior from payload props without changing the feedback panel shell.

Pairs with backend sub-issue 4.2.

#### Sub-issue 4.3. Deliver retry boundary integration and retry-state transitions

Result: the frontend wires the retry feedback boundary, handles retry-state transitions, and synchronizes hint level or retry eligibility with the existing feedback panel.

Pairs with backend sub-issue 4.3.

### Parent Issue 5. Progress and next-step guidance frontend

Goal: provide the frontend slice needed for visible progress and sensible follow-up guidance.

#### Sub-issue 5.1. Deliver progress surface shell and status marker components

Result: the frontend delivers progress surfaces, completion markers, in-progress indicators, and recent-activity component states against local props or fixture data without depending on final provider integration.

Frontend-only supporting task for parent issue 5. Backend pairing starts at summary and recommendation slices in sub-issues 5.2 and 5.3.

#### Sub-issue 5.2. Deliver progress summary integration and activity-state handling

Result: the frontend consumes the progress summary boundary through a swappable provider seam and handles loading, empty, and unavailable progress states without redesigning the progress surface.

Pairs with backend sub-issue 5.2.

#### Sub-issue 5.3. Deliver recommendation presentation and follow-up guidance UX

Result: the frontend presents next-step recommendations, solved-versus-next distinctions, and follow-up guidance actions using the recommendation payload without redesigning the progress surface.

Pairs with backend sub-issue 5.3.
