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

#### Sub-issue 1.1. Build the catalog screen against a local scenario data seam

Result: the learner can browse exercise cards and start an exercise without waiting on the final backend integration.

#### Sub-issue 1.2. Swap the catalog screen to a stable summary-loading boundary

Result: the catalog can move from local fixtures to backend-backed data without redesigning the screen.

#### Sub-issue 1.3. Add topic and difficulty filtering to the catalog

Result: the learner can narrow the catalog to a manageable list using filter-ready summary fields.

#### Sub-issue 1.4. Add loading, empty, and request failure states for catalog browsing

Result: the catalog remains understandable when data is pending, unavailable, or fails to load.

### Parent Issue 2. Exercise context and workspace frontend

Goal: provide the frontend slice needed to open an exercise and understand its context.

#### Sub-issue 2.1. Build the exercise detail screen for task text and ordered steps

Result: the learner can read the exercise goal, instructional content, and explanation text in one stable screen.

#### Sub-issue 2.2. Render repository context cues for the first exercise slice

Result: the learner can inspect branches, status hints, and file-state summaries without leaving the exercise screen.

#### Sub-issue 2.3. Wire exercise routing and data loading for one open exercise

Result: the app can open one exercise from the catalog and load its detail through a stable screen boundary.

#### Sub-issue 2.4. Add fallback states for exercise loading and missing exercise data

Result: the exercise screen remains understandable when detail data is pending, unavailable, or fails to load.

### Parent Issue 3. Submission and correctness frontend

Goal: provide the frontend slice needed for answer submission and first-pass correctness feedback.

#### Sub-issue 3.1. Add answer input and submit actions to the exercise screen

Result: the learner can enter a Git answer and submit it from the workspace.

#### Sub-issue 3.2. Add pending, disabled, and request failure states for submission

Result: the submission flow prevents ambiguous retries and handles request failures clearly.

#### Sub-issue 3.3. Render correctness summary states for submitted answers

Result: the learner can immediately see whether the answer passed, partially matched, or failed.

### Parent Issue 4. Guided retry and hints frontend

Goal: provide the frontend slice needed for instructional retries.

#### Sub-issue 4.1. Render explanation feedback for incorrect or partial answers

Result: the learner can understand why the answer failed instead of seeing only a status label.

#### Sub-issue 4.2. Add retry flow that preserves exercise context

Result: the learner can submit another attempt without losing the current task and repository context.

#### Sub-issue 4.3. Add progressive hint reveal interactions

Result: the learner can request stronger hints over time from the exercise screen.

### Parent Issue 5. Progress and next-step guidance frontend

Goal: provide the frontend slice needed for visible progress and sensible follow-up guidance.

#### Sub-issue 5.1. Show solved and in-progress markers in the catalog and exercise header

Result: the learner can tell what is solved or in progress from the main training flow.

#### Sub-issue 5.2. Build recent attempts and unfinished work surfaces

Result: the learner can return to unfinished or recently attempted scenarios without searching manually.

#### Sub-issue 5.3. Render progress summary and next-exercise recommendation surfaces

Result: the learner can see topic-level progress and a suggested next scenario in one consistent area.
