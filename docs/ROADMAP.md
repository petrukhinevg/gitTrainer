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

#### Sub-issue 1.2. Seed the MVP catalog with beginner Git scenarios

Result: the app has an initial set of exercises for status inspection, branching, commit history, and conflict basics.

### Parent Issue 2. Validation and feedback loop

Goal: let learners submit answers and receive meaningful correctness feedback.

#### Sub-issue 2.1. Implement answer validation for structured Git actions

Result: backend logic can determine whether a learner solved an exercise and which condition failed.

#### Sub-issue 2.2. Return explanation and hint payloads for failed attempts

Result: the UI can explain mistakes instead of showing only pass/fail.

### Parent Issue 3. SPA training workspace

Goal: build the user-facing interface for selecting, solving, and reviewing Git exercises.

#### Sub-issue 3.1. Create scenario catalog and entry flow

Result: a learner can browse the available Git exercises and start one.

#### Sub-issue 3.2. Build the exercise workspace and result panel

Result: a learner can inspect the prompt, submit an answer, and read validation feedback in one SPA flow.

### Parent Issue 4. Progress and retention

Goal: make repeat practice visible so learners can track growth over time.

#### Sub-issue 4.1. Persist session outcomes and completion state

Result: completed exercises and recent attempts survive page reloads and backend restarts once persistence is added.

#### Sub-issue 4.2. Add learner progress summary

Result: the app can show completed exercises, weak areas, and next suggested topics.
