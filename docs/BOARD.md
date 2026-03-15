# Project Board

Local description of the project board for `gitTrainer`.

Repository: https://github.com/petrukhinevg/gitTrainer

Online board: https://github.com/users/petrukhinevg/projects/4

Project custom field: `Pairs with` stores the counterpart backend/frontend issue when a child task has a paired issue on the other side.

## Columns
- `Backlog`: everything captured but not ready for implementation
- `Ready`: tasks with a clear result and acceptance criteria
- `In Progress`: active implementation
- `Review`: implemented and waiting for review
- `Done`: accepted and completed

### Ready

- `#98` Parent Issue 1. Scenario catalog browsing MVP
- `#137` Sub-issue 1.1. Deliver complete catalog summary boundary for MVP browsing
- `#138` Sub-issue 1.2. Deliver catalog browsing UI against a swappable summary provider

### Review

- `#97` Rework roadmap for independent vertical epics

### Backlog

- `#99` Parent Issue 2. Exercise context and workspace MVP
- `#100` Parent Issue 3. Submission and correctness MVP
- `#101` Parent Issue 4. Guided retry and hints MVP
- `#102` Parent Issue 5. Progress and next-step guidance MVP
- `#139` Sub-issue 2.1. Deliver complete exercise detail and repository context boundary
- `#140` Sub-issue 2.2. Deliver exercise workspace UI against a swappable detail provider
- `#141` Sub-issue 3.1. Deliver complete submission and correctness boundary for MVP answer types
- `#142` Sub-issue 3.2. Deliver submission UI and correctness states against a swappable submission provider
- `#143` Sub-issue 4.1. Deliver explanation and hint progression boundary
- `#144` Sub-issue 4.2. Deliver retry and hint UX against a swappable feedback provider
- `#145` Sub-issue 5.1. Deliver progress and recommendation boundary
- `#146` Sub-issue 5.2. Deliver progress surfaces against a swappable progress provider

## Update rule

- New work should first be recorded in the roadmap or issue list.
- When a task is taken into work, move it to `In Progress`.
- After implementation, move it to `Review`.
- After acceptance, move it to `Done`.
