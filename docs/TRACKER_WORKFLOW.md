# Tracker Workflow

## Basic process

1. A user creates a task in the tracker.
2. For an epic, the assignee creates the epic branch, makes the initial epic commit on that branch, and only then creates child task branches from the current epic branch head.
3. An assignee takes a task into work in its dedicated branch.
4. The task branch should also be registered as the issue's linked branch so GitHub can connect future PRs to `Linked pull requests`.
5. After implementation, the assignee pushes the branch, creates or updates the PR, verifies the PR appears in `Linked pull requests`, and then moves the task to `Review`.
6. If review finds issues, fix them in the same branch in a follow-up commit marked as a review fix.
7. If review finds that the task mixes product discovery with implementation, split scope and update the roadmap first.
8. Each task should describe a complete and reviewable result.

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
- After creating an epic branch, make the initial epic commit on that branch before creating any child task branches.
- After the initial epic commit exists, create child task branches for all currently defined sub-issues right away.
- Child task branches inside an epic are created from the current epic branch head, not from `main`.
- A child task branch must be created from the current epic branch head, never from another child task branch.
- If the epic branch has absorbed reviewed work during the allowed merge phase, later child branches are still created from that updated epic branch, not from the merged child branch tip.
- Do not merge child work into the epic branch or merge the epic branch into `main` early just to unblock later development.
- If a child task depends on unfinished or still-unmerged child work, treat that task as blocked, preserve any exploratory work outside the canonical `task/*` branch names, and continue only with independent child tasks.
- Exception: merging a child task branch into its epic branch is allowed when further development is genuinely impossible without that integrated result.
- Each epic branch should have its own PR to `main`, linked to the epic issue.
- Child task branches are implemented separately and should not be merged into the epic branch before review is complete and the task is `Done`.
- Each task branch should have one main implementation commit unless review fixes are needed.
- The main implementation commit should be named as `number_ShortCommitDescription`, where `number` is the task number.
- Treat child task branches as isolated WIP while other child tasks can still be developed independently from the epic branch baseline.
- If implementing a later child task would require merging an earlier child branch into the epic branch before the epic is otherwise ready, skip that task for now and continue with other unblocked child tasks.
- Merge reviewed child branches into the epic branch only when the remaining unfinished tasks are specifically blocked by those completed child branches and no independent child work remains.
- When a child or standalone task is moved to `Review`, push the branch before changing the board status.
- After push, each task branch should have its own PR against the epic branch.
- Before moving a task to `Review`, verify that the task's PR is linked and visible in the `Linked pull requests` field.
- If the platform requires manual issue linking for non-default-target PRs, link the PR manually before moving the task to `Review`.

## Fast board setup

Use this sequence to avoid manual cleanup later:

1. Create the parent issue and all child issues.
2. Link every child issue to its parent issue immediately.
3. Create the epic branch from `main`.
4. Make the initial epic commit on the epic branch.
5. Push the epic branch to `origin`.
6. Create the epic PR to `main`.
7. Create each child task branch from the current epic branch head.
8. Register each child branch as the linked branch for its issue before implementation starts.
9. Add all issues to the board and set their initial `Status`.

## Linked branch and PR setup

Use this sequence for each child task so `Linked pull requests` is populated predictably:

1. Ensure the epic branch already exists on `origin`.
2. Create the local task branch from the current epic branch head.
3. Push the task branch to `origin`.
4. Register the task branch as the issue's linked branch.
5. Implement the task and create the task PR with the epic branch as `base`.
6. Verify the issue shows the PR in `Linked pull requests` before moving the task to `Review`.

If the branch was created locally before GitHub issue linkage was configured, do not assume the field will backfill automatically. In that case:

- verify the task branch exists on `origin`
- verify the PR base is the epic branch
- manually confirm the PR is associated with the issue
- if GitHub still does not populate `Linked pull requests`, correct the linkage before relying on the board state

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
