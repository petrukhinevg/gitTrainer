# Project Board

Local description of the project board for `gitTrainer`.

Repository: https://github.com/petrukhinevg/gitTrainer

Online board: https://github.com/users/petrukhinevg/projects/4

## Columns
- `Backlog`: everything captured but not ready for implementation
- `Ready`: tasks with a clear result and acceptance criteria
- `In Progress`: active implementation
- `Review`: implemented and waiting for review
- `Done`: accepted and completed

### Ready

- `#98` Parent Issue 1. Scenario catalog browsing MVP
- `#103` Sub-issue 1.1. Deliver catalog summary payloads for status and branch basics
- `#105` Sub-issue 1.3. Add catalog fields needed for frontend filtering and sorting
- `#106` Sub-issue 1.4. Build the catalog screen against a local scenario data seam
- `#107` Sub-issue 1.5. Swap the catalog screen to a stable summary-loading boundary

### Review

- `#97` Rework roadmap for independent vertical epics

### Backlog

- `#99` Parent Issue 2. Exercise context and workspace MVP
- `#100` Parent Issue 3. Submission and correctness MVP
- `#101` Parent Issue 4. Guided retry and hints MVP
- `#102` Parent Issue 5. Progress and next-step guidance MVP
- `#104` Sub-issue 1.2. Extend catalog summary coverage with history, rebase, and conflict starters
- `#108` Sub-issue 1.6. Add topic and difficulty filtering to the catalog
- `#109` Sub-issue 1.7. Add loading, empty, and request failure states for catalog browsing
- `#110` Sub-issue 2.1. Deliver scenario detail payloads for status and branch exercises
- `#111` Sub-issue 2.2. Deliver repository context payloads for status and branch exercises
- `#112` Sub-issue 2.3. Extend scenario detail delivery with history and conflict context
- `#113` Sub-issue 2.4. Add a scenario-loading seam that can evolve beyond in-memory fixtures
- `#114` Sub-issue 2.5. Build the exercise detail screen for task text and ordered steps
- `#115` Sub-issue 2.6. Render repository context cues for the first exercise slice
- `#116` Sub-issue 2.7. Wire exercise routing and data loading for one open exercise
- `#117` Sub-issue 2.8. Add fallback states for exercise loading and missing exercise data
- `#118` Sub-issue 3.1. Deliver session start and answer submission contracts for command-based exercises
- `#119` Sub-issue 3.2. Validate single-command exercises and return structured pass or fail results
- `#120` Sub-issue 3.3. Validate multi-command and repository-state exercises
- `#121` Sub-issue 3.4. Add answer input and submit actions to the exercise screen
- `#122` Sub-issue 3.5. Add pending, disabled, and request failure states for submission
- `#123` Sub-issue 3.6. Render correctness summary states for submitted answers
- `#124` Sub-issue 4.1. Return failure codes and explanation payloads for incorrect answers
- `#125` Sub-issue 4.2. Return partial-match feedback for near-correct answers
- `#126` Sub-issue 4.3. Add hint progression across repeated failures
- `#127` Sub-issue 4.4. Render explanation feedback for incorrect or partial answers
- `#128` Sub-issue 4.5. Add retry flow that preserves exercise context
- `#129` Sub-issue 4.6. Add progressive hint reveal interactions
- `#130` Sub-issue 5.1. Persist attempt outcomes and per-scenario completion state
- `#131` Sub-issue 5.2. Expose solved, in-progress, and recent-attempt data
- `#132` Sub-issue 5.3. Expose progress summary and next-scenario recommendation data
- `#133` Sub-issue 5.4. Show solved and in-progress markers in the catalog and exercise header
- `#134` Sub-issue 5.5. Build recent attempts and unfinished work surfaces
- `#135` Sub-issue 5.6. Render progress summary and next-exercise recommendation surfaces

## Update rule

- New work should first be recorded in the roadmap or issue list.
- When a task is taken into work, move it to `In Progress`.
- After implementation, move it to `Review`.
- After acceptance, move it to `Done`.
