# Roadmap

## Goal

The product is a single-page web application for practicing Git through short, structured exercises. A learner should be able to open the app, choose a scenario such as branching, rebasing, conflict resolution, or history cleanup, and work through a guided task with immediate validation.

The main user problem is the gap between reading Git theory and confidently using commands in context. The MVP should focus on practical repetition: clear tasks, observable repository state, answer validation, and explanations that help the learner understand mistakes.

## Roadmap usage rules

- This roadmap should describe large `parent issues` and compact `sub-issues`.
- One task should produce a complete, testable result.
- If a task grows too large, create a `parent issue` and split it into `sub-issues`.
- If the product has multiple technical sides, define the contract and ownership boundaries before implementation drifts.

## Roadmap structure

This project keeps shared scope in this file and uses side-specific breakdowns in:

- `docs/BACKEND_ROADMAP.md`
- `docs/FRONTEND_ROADMAP.md`

## MVP definition

The MVP is complete when:

1. a learner can open the app and choose from a small catalog of Git training scenarios
2. a learner can complete an exercise by entering or selecting Git actions in a guided workspace
3. the system validates the attempt and explains why the answer is correct or incorrect
4. the app records progress so the learner can see completed exercises and return for more practice

## How to use in the tracker

- If a task belongs only to one technical area, take it from that area's roadmap.
- If a feature requires changes across multiple areas, create one `parent issue` and separate side-specific `sub-issues`.
- Keep the current queue and status mapping aligned with `docs/BOARD.md`.

## Parent issues

### Parent Issue 1. Training scenario foundation

Goal: define the core exercise model and deliver a first playable set of Git practice scenarios.

#### Sub-issue 1.1. Model scenario metadata and exercise steps

Result: the system can describe exercises with topic, difficulty, starting state, expected outcome, and explanation text.

#### Sub-issue 1.2. Define repository state and expected outcome representations

Result: exercises can describe both the learner-visible repository situation and the machine-checkable success target.

#### Sub-issue 1.3. Seed the MVP catalog with status and branch basics

Result: the app has a first small catalog covering status inspection, branch creation, and branch switching.

#### Sub-issue 1.4. Seed the MVP catalog with history and conflict basics

Result: the app extends the catalog with commit history inspection, simple rebases, and conflict-resolution starter exercises.

### Parent Issue 2. Validation and feedback loop

Goal: let learners submit answers and receive meaningful correctness feedback.

#### Sub-issue 2.1. Accept exercise answers through a stable submission contract

Result: frontend and backend share a clear request and response shape for learner submissions.

#### Sub-issue 2.2. Implement answer validation for structured Git actions

Result: backend logic can determine whether a learner solved an exercise and which condition failed.

#### Sub-issue 2.3. Return explanation payloads for failed attempts

Result: the UI can explain mistakes instead of showing only pass/fail.

#### Sub-issue 2.4. Add targeted hint progression for repeated failures

Result: a learner can receive increasingly useful hints after multiple unsuccessful attempts.

### Parent Issue 3. SPA training workspace

Goal: build the user-facing interface for selecting, solving, and reviewing Git exercises.

#### Sub-issue 3.1. Create scenario catalog and entry flow

Result: a learner can browse the available Git exercises and start one.

#### Sub-issue 3.2. Render exercise context and answer input in one workspace

Result: a learner can inspect the prompt, repository context, and answer controls in one SPA flow.

#### Sub-issue 3.3. Render validation feedback and retry flow

Result: a learner can review errors, retry the task, and continue without losing workspace context.

#### Sub-issue 3.4. Add loading, empty, and error states for core SPA screens

Result: the main catalog, exercise, and progress flows remain understandable under incomplete or failed API responses.

### Parent Issue 4. Progress and retention

Goal: make repeat practice visible so learners can track growth over time.

#### Sub-issue 4.1. Persist session outcomes and completion state

Result: completed exercises and recent attempts survive page reloads and backend restarts once persistence is added.

#### Sub-issue 4.2. Show solved and in-progress exercises in the UI

Result: the learner can quickly distinguish completed exercises from unfinished ones.

#### Sub-issue 4.3. Add learner progress summary

Result: the app can show completed exercises, weak areas, and next suggested topics.

#### Sub-issue 4.4. Add lightweight recommendation rules for the next exercise

Result: the product can suggest a sensible follow-up scenario based on recent learner results.
