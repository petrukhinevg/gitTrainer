# Roadmap

## Goal

The product is a single-page web application for practicing Git through short, structured exercises. A learner should be able to open the app, choose a scenario such as branching, rebasing, conflict resolution, or history cleanup, and work through a guided task with immediate validation.

The main user problem is the gap between reading Git theory and confidently using commands in context. The MVP should focus on practical repetition: clear tasks, observable repository state, answer validation, and explanations that help the learner understand mistakes.

## Roadmap usage rules

- This roadmap should describe product-level `parent issues` only.
- Do not use this file as the direct source for implementation-sized tasks.
- One parent issue may include backend work, frontend work, or both.
- Detailed implementation tasks belong in the side-specific roadmaps.
- Prefer parent issues that describe one learner-visible vertical slice or one planning block with clear boundaries.
- If child tasks inside an epic would require code from unfinished sibling tasks, split the epic differently or merge that work into one task.

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
- When backend and frontend work describe the same learner-facing slice, keep them under the same parent issue and link them as paired child tasks.
- Keep the current queue and status mapping aligned with `docs/BOARD.md`.

## Parent issues

### Parent Issue 1. Scenario catalog browsing MVP

Goal: let the learner browse a small catalog of Git exercises and choose one to open.

Includes work such as:

- delivering scenario summary data for the first MVP exercises
- exposing an initial catalog from backend or local fixtures
- rendering the catalog list, filters, and entry actions
- handling loading, empty, and error states for catalog browsing

### Parent Issue 2. Exercise context and workspace MVP

Goal: let the learner open one exercise and understand the task, repository situation, and expected target before answering.

Includes work such as:

- delivering scenario detail payloads and repository context
- rendering task instructions, step content, and repository cues
- wiring the exercise route and workspace shell
- keeping the exercise screen understandable before validation is added

### Parent Issue 3. Submission and correctness MVP

Goal: let the learner submit an answer and receive an immediate correctness result.

Includes work such as:

- starting an exercise session and accepting learner submissions
- validating the first supported answer types
- rendering answer input, pending states, and correctness feedback
- returning machine-readable validation outcomes that the UI can present clearly

### Parent Issue 4. Guided retry and hints MVP

Goal: help the learner recover from mistakes without losing context.

Includes work such as:

- returning explanations for incorrect or partial answers
- preserving exercise context across retries
- revealing stronger hints after repeated failures
- making the retry loop instructional instead of binary

### Parent Issue 5. Progress and next-step guidance MVP

Goal: make repeat practice visible so the learner can track progress and choose what to do next.

Includes work such as:

- storing attempt outcomes and completion state
- presenting solved and in-progress exercises
- summarizing learner progress over time
- recommending sensible next exercises
