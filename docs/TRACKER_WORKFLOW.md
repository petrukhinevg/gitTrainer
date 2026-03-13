# Tracker Workflow

## Basic process

1. A user creates a task in the tracker.
2. An assignee takes the task into work in a dedicated branch.
3. After implementation, the task moves to `Review`.
4. If review finds issues, fix them in the same branch in a follow-up commit marked as a review fix.
5. If review finds that the task mixes product discovery with implementation, split scope and update the roadmap first.
6. Each task should describe a complete and reviewable result.

## Board columns

- `Backlog`: captured but not ready
- `Ready`: sufficiently defined and ready for implementation
- `In Progress`: active development
- `Review`: implemented and waiting for review
- `Done`: accepted and finished

Keep the actual board state in `docs/BOARD.md` or the remote project board.

## Decomposition rules

- A task must produce a clear and testable result.
- A task should be small enough to implement, test, and review without excessive context.
- If a feature requires major changes across multiple areas at once, it is a good candidate for a `parent issue`.
- If the result cannot be described in one short outcome statement, split the task.
- For this product, separate content modeling, validation logic, and SPA UX work unless a very small change naturally spans them.

## What counts as a task

Suitable task:

- one learner-facing capability, such as starting a scenario or viewing progress;
- one technical sub-feature needed to unlock the next capability, such as validation payloads or session persistence;
- one infrastructure or platform step that enables further work;
- one content or configuration step that unlocks the next increment, such as seeding the initial Git exercise catalog.

Unsuitable task:

- "build the entire frontend";
- "implement the whole Git engine";
- "add all training scenarios";
- any work item that naturally splits into several independent results.

## What counts as a parent issue

Create a `parent issue` when:

- a feature contains several independent user flows;
- the result cannot be shipped as one compact change;
- completion requires a sequence of tasks that should be reviewed separately.

## Git workflow

- `main` is the production branch.
- Epic branches and standalone task branches are created from `main`.
- Child task branches inside an epic are created from the epic branch.
- Each epic branch should have its own PR to `main`, linked to the epic issue.
- Child task branches are implemented separately and should not be merged into the epic branch before review is complete and the task is `Done`.
- Each task branch should have one main implementation commit unless review fixes are needed.
- The main implementation commit should be named as `number_ShortCommitDescription`, where `number` is the task number.
- Treat child task branches as isolated WIP while other child tasks can still be developed independently from the epic branch baseline.
- If implementing a later child task would require merging an earlier child branch into the epic branch before the epic is otherwise ready, skip that task for now and continue with other unblocked child tasks.
- Merge reviewed child branches into the epic branch only when the remaining unfinished tasks are specifically blocked by those completed child branches and no independent child work remains.
- After push, each task branch should have its own PR against the epic branch.
- If the platform requires manual issue linking for non-default-target PRs, link the PR manually and verify that the board shows it in `Linked pull requests`.

## Task template

- Title: short and concrete
- Result: what becomes possible after completion
- Done criteria: 2-5 testable points
- Constraints: what is out of scope
- Side: `backend`, `frontend`, `fullstack`, `content`, or another project-specific label

## Parent issue template

- Title: large product or platform area
- Goal: what complete block is being built
- `Sub-issues`: each should provide an independent testable result
- Boundary: what stays out of scope
- Order: recommended implementation sequence
