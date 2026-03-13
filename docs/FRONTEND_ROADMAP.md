# Frontend Roadmap

## Goal

The frontend must provide a focused single-page training experience where learners move from scenario selection to solving Git tasks without page reloads or context loss. It should make repository state, expected task goal, current answer, and feedback easy to compare on one screen.

For the MVP, the frontend should enable a learner to browse exercises, enter a training session, submit an answer, and understand the result through clear feedback and progress cues.

## Roadmap usage rules

- Items below should be suitable for creating issues.
- One task should produce a complete and testable frontend result.
- If a frontend item grows too large, convert it into a `parent issue` with `sub-issues`.

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

### Parent Issue 1. SPA shell and navigation

Goal: create the client structure that supports a catalog view, exercise view, and progress view.

#### Sub-issue 1.1. Build the base application shell and route structure

Result: the app can switch between the main training screens without reloads.

#### Sub-issue 1.2. Add shared app states for loading, empty, and request failures

Result: the shell can render understandable fallback states before all feature screens are fully wired.

#### Sub-issue 1.3. Implement catalog listing and entry actions

Result: the learner can discover available Git scenarios and start one quickly.

#### Sub-issue 1.4. Add catalog filtering by topic and difficulty

Result: the learner can narrow the scenario list to a manageable set before starting practice.

### Parent Issue 2. Exercise workspace

Goal: design the main screen where the learner solves a Git task.

#### Sub-issue 2.1. Create the scenario detail layout

Result: the learner can read the task goal, step context, and scenario metadata in a stable workspace layout.

#### Sub-issue 2.2. Render repository context and hints panel

Result: the learner can inspect branches, status cues, and other repository hints without leaving the exercise screen.

#### Sub-issue 2.3. Add answer input controls and submission states

Result: the learner can enter a Git answer, submit it once, and see pending state without ambiguous UI transitions.

#### Sub-issue 2.4. Add validation feedback rendering

Result: the learner can understand whether the answer passed, partially matched, or failed and why.

#### Sub-issue 2.5. Add retry flow and hint reveal interactions

Result: the learner can retry the task and progressively request more help without losing the current scenario context.

### Parent Issue 3. Progress and motivation surfaces

Goal: make repeated practice visible and encourage the next exercise.

#### Sub-issue 3.1. Show completion state in the catalog and exercise header

Result: the learner can immediately see solved and in-progress exercises in the main training flow.

#### Sub-issue 3.2. Build recent attempts and unfinished work view

Result: the learner can return to partially completed or recently failed scenarios without searching manually.

#### Sub-issue 3.3. Add topic-based progress summary

Result: the app can highlight strengths, weak spots, and the next recommended Git topic.

#### Sub-issue 3.4. Render next-exercise recommendation card

Result: the UI can surface the most relevant next scenario after a learner finishes or leaves an exercise.
