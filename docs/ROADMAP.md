# Roadmap

## Goal

The product is a single-page web application for practicing Git through short, structured exercises. A learner should be able to open the app, choose a scenario such as branching, rebasing, conflict resolution, or history cleanup, and work through a guided task with immediate validation.

The main user problem is the gap between reading Git theory and confidently using commands in context. The MVP should focus on practical repetition: clear tasks, observable repository state, answer validation, and explanations that help the learner understand mistakes.

## Roadmap usage rules

- This roadmap should describe product-level `parent issues` only.
- Do not use this file as the direct source for implementation-sized tasks.
- One parent issue may include backend work, frontend work, or both.
- Detailed implementation tasks belong in the side-specific roadmaps.

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

- Create parent issues from this file when the work describes one meaningful product block.
- If a parent issue spans multiple technical sides, decompose it into side-specific tasks in the relevant roadmaps.
- If a parent issue affects only one side, keep the detailed task breakdown only in that side's roadmap.
- Keep the current queue and status mapping aligned with `docs/BOARD.md`.

## Parent issues

### Parent Issue 1. Training scenario foundation

Goal: define the core exercise model and deliver a first playable set of Git practice scenarios.

Includes work such as:

- modeling Git training scenarios and their exercise content
- defining repository state and expected outcome concepts
- loading or serving the initial scenario catalog
- seeding the first MVP scenario sets

### Parent Issue 2. Validation and feedback loop

Goal: let learners submit answers and receive meaningful correctness feedback.

Includes work such as:

- defining submission and validation contracts
- validating learner answers against expected outcomes
- returning explanations and machine-readable failure details
- revealing stronger hints after repeated failures

### Parent Issue 3. SPA training workspace

Goal: build the user-facing interface for selecting, solving, and reviewing Git exercises.

Includes work such as:

- building the SPA shell and route structure
- presenting the scenario catalog and entry flow
- rendering the exercise workspace and answer controls
- showing feedback, retry flow, and fallback states

### Parent Issue 4. Progress and retention

Goal: make repeat practice visible so learners can track growth over time.

Includes work such as:

- storing attempt outcomes and completion state
- presenting solved and in-progress exercises
- summarizing learner progress over time
- recommending sensible next exercises
