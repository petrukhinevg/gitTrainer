# Frontend Roadmap

## Goal

The frontend must provide a focused single-page training experience where learners move from scenario selection to solving Git tasks without page reloads or context loss. It should make repository state, expected task goal, current answer, and feedback easy to compare on one screen.

For the MVP, the frontend should enable a learner to browse exercises, enter a training session, submit an answer, and understand the result through clear feedback and progress cues.

## Roadmap usage rules

- Items below should be suitable for creating issues.
- One task should produce a complete and testable frontend result.
- If a frontend item grows too large, convert it into a `parent issue` with `sub-issues`.
- Prefer issue sizes that can usually be implemented and reviewed in one focused PR.

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

## Product epic alignment

### Product Parent Issue 1. Training scenario foundation

Goal: give the frontend stable scenario-facing contracts and presentation primitives so later SPA screens can consume the seeded training content without reworking how scenario data is interpreted or displayed.

These tasks belong to the product-level training scenario foundation epic, not to the later SPA shell or validation-flow epics.

#### Sub-issue 1.13. Define client-side scenario summary and detail view models

Result: the frontend has stable UI-facing types for scenario metadata, exercise steps, repository context, and validation-target summaries.

#### Sub-issue 1.14. Add frontend scenario fixture and loading seam

Result: frontend development can consume scenario summaries and detail payloads through one boundary, whether the source is local fixtures or the future backend contract.

#### Sub-issue 1.15. Add scenario metadata presentation primitives

Result: the UI has reusable rendering primitives for title, topic, difficulty, and summary metadata used by seeded scenarios.

#### Sub-issue 1.16. Add exercise content presentation primitives

Result: the UI can render ordered instructions, step text, and explanation copy from seeded scenario content consistently.

#### Sub-issue 1.17. Add repository context presentation primitives

Result: the UI can render scenario repository cues such as branches, status hints, and file-state summaries without hard-coding one exercise shape.

## Parent issues

### Parent Issue 1. SPA shell and navigation

Goal: create the client structure that supports a catalog view, exercise view, and progress view.

#### Sub-issue 1.1. Build the base application shell and route structure

Result: the app can switch between the main training screens without reloads.

#### Sub-issue 1.2. Add shared loading state components

Result: core screens can show consistent loading feedback while data is pending.

#### Sub-issue 1.3. Add shared empty state components

Result: the shell can render understandable empty results without each screen inventing its own fallback pattern.

#### Sub-issue 1.4. Add shared request failure state components

Result: core screens can show recoverable error messages with a consistent retry affordance.

#### Sub-issue 1.5. Implement catalog list rendering

Result: the learner can discover available Git scenarios and start one quickly.

#### Sub-issue 1.6. Add catalog entry actions

Result: the learner can enter a scenario from the catalog through a clear start action.

#### Sub-issue 1.7. Add catalog filtering by topic

Result: the learner can narrow the scenario list by Git topic.

#### Sub-issue 1.8. Add catalog filtering by difficulty

Result: the learner can narrow the scenario list by exercise complexity.

### Parent Issue 2. Exercise workspace

Goal: design the main screen where the learner solves a Git task.

#### Sub-issue 2.1. Create the scenario detail layout

Result: the learner can read the task goal, step context, and scenario metadata in a stable workspace layout.

#### Sub-issue 2.2. Render repository context panel

Result: the learner can inspect branches, status cues, and other repository state details without leaving the exercise screen.

#### Sub-issue 2.3. Render hints panel

Result: the learner can view available hints in a dedicated area without mixing them into the main task text.

#### Sub-issue 2.4. Add answer input controls

Result: the learner can enter a Git answer and submit it from the workspace.

#### Sub-issue 2.5. Add answer submission pending and disabled states

Result: the workspace prevents ambiguous resubmission while a validation request is in flight.

#### Sub-issue 2.6. Add validation feedback summary rendering

Result: the learner can understand whether the answer passed, partially matched, or failed.

#### Sub-issue 2.7. Add validation explanation rendering

Result: the learner can read why the answer failed or partially matched.

#### Sub-issue 2.8. Add retry flow interactions

Result: the learner can retry the task without losing the current scenario context.

#### Sub-issue 2.9. Add progressive hint reveal interactions

Result: the learner can request stronger hints over time from the exercise workspace.

### Parent Issue 3. Progress and motivation surfaces

Goal: make repeated practice visible and encourage the next exercise.

#### Sub-issue 3.1. Show completion state in the catalog

Result: the learner can immediately distinguish solved and in-progress exercises while browsing the catalog.

#### Sub-issue 3.2. Show completion state in the exercise header

Result: the learner can confirm current progress without leaving the active scenario.

#### Sub-issue 3.3. Build recent attempts view

Result: the learner can review the most recent practice attempts in one place.

#### Sub-issue 3.4. Build unfinished work view

Result: the learner can return to in-progress scenarios without searching manually.

#### Sub-issue 3.5. Add topic-based progress summary

Result: the app can highlight strengths, weak spots, and the next recommended Git topic.

#### Sub-issue 3.6. Render next-exercise recommendation card

Result: the UI can surface the most relevant next scenario after a learner finishes or leaves an exercise.
