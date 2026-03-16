# Tracker Workflow

## Basic process

1. A user creates a task in the tracker.
2. The task should receive the correct label set when it is created so its scope and side are explicit from the start.
3. For an epic, the assignee creates the epic branch, makes the initial epic commit on that branch, and only then creates child task branches from the current epic branch head.
4. An assignee takes a task into work in its dedicated branch.
5. The task branch should also be registered as the issue's linked branch so GitHub can connect future PRs to `Linked pull requests`.
6. After implementation, the assignee pushes the branch, creates or updates the PR, and then moves the task to `Review`.
7. For task branches that target `main`, the assignee should verify the PR appears in `Linked pull requests` before considering the review handoff complete.
8. For task branches that target a non-`main` base such as an epic branch, the assignee should not wait for `Linked pull requests` to populate before moving the task to `Review`.
9. If review finds issues, fix them in the same branch in a follow-up commit marked as a review fix.
10. If review finds that the task mixes product discovery with implementation, split scope and update the roadmap first.
11. Each task should describe a complete and reviewable result.

## Board columns

- `Backlog`: captured but not ready
- `Ready`: sufficiently defined and ready for implementation
- `In Progress`: active development
- `Review`: implemented and waiting for review
- `Done`: accepted and finished

Keep the actual board state in `docs/BOARD.md` or the remote project board.

Use the project field `Pairs with` when a backend task and a frontend task represent the same learner-facing slice but remain independently implementable.

## Decomposition rules

- A task must produce a clear and testable result.
- A task should be small enough to implement, test, and review without excessive context.
- If a feature requires major changes across multiple areas at once, it is a good candidate for a `parent issue`.
- If the result cannot be described in one short outcome statement, split the task.
- Do not over-decompose at the start of an epic when the stable seams are not yet clear.
- It is valid to split a child task later in the epic once the contract, data shape, or UI loop is better understood and the split improves parallelism or reviewability.
- Do not split work below the level of a useful PR; if a sub-issue has no standalone review value, it is too small.
- For this product, separate content modeling, validation logic, and SPA UX work unless a very small change naturally spans them.
- Do not keep sibling tasks in the same parent issue when one would require code from another unfinished sibling task. Merge them or split the parent issue differently.
- Backend and frontend tasks may be paired for the same learner-facing slice, but pairing is preferred rather than required.
- Backend-only or frontend-only child tasks are valid when they still deliver a complete result from the epic baseline.

## What counts as a task

Suitable task:

- one learner-facing capability, such as starting a scenario or viewing progress;
- one technical sub-feature needed to unlock the next capability, such as validation payloads or session persistence;
- one infrastructure or platform step that enables further work;
- one content or configuration step that unlocks the next increment, such as seeding the initial Git exercise catalog.

Issue creation rule:

- assign the correct project label set when the task is created
- do not leave a new issue unlabeled if the intended side or work type is already known

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

When decomposing a parent issue:

- start with the smallest set of child tasks that already have clear independent outcomes
- add finer-grained child tasks later only where that improves parallel work or reduces blocking
- keep the child set shaped around independently implementable results, not framework layers

## Git workflow

- `main` is the production branch.
- Use a single local repository directory by default. Do not create a separate local folder or `git worktree` for each task unless the user explicitly requests it.
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
- Before moving a task to `Review`, verify that the task's PR is linked and visible in the `Linked pull requests` field only when the PR targets `main`.
- If the PR targets a non-`main` base such as an epic branch, do not wait for `Linked pull requests` to populate before moving the task to `Review`.
- If the platform requires manual issue linking for non-default-target PRs, complete that linkage as follow-up metadata work, but do not block the move to `Review` on the field becoming visible.
- If a child task is split during implementation, create the new child branches from the current epic branch head, not from the in-progress sibling branch.

## Fast board setup

Use this sequence to avoid manual cleanup later:

1. Create the parent issue and all child issues.
2. Assign the correct labels to every issue immediately.
3. Link every child issue to its parent issue immediately.
4. Create the epic branch from `main`.
5. Make the initial epic commit on the epic branch.
6. Push the epic branch to `origin`.
7. Create the epic PR to `main`.
8. Create each child task branch from the current epic branch head.
9. Register each child branch as the linked branch for its issue before implementation starts.
10. Add all issues to the board and set their initial `Status`.

## Linked branch and PR setup

Use this sequence for each child task so `Linked pull requests` is populated predictably:

1. Ensure the epic branch already exists on `origin`.
2. Create the local task branch from the current epic branch head.
3. Push the task branch to `origin`.
4. Register the task branch as the issue's linked branch.
5. Implement the task and create the task PR with the epic branch as `base`.
6. Verify the issue shows the PR in `Linked pull requests` before moving the task to `Review` only when the PR targets `main`.

If the branch was created locally before GitHub issue linkage was configured, do not assume the field will backfill automatically. In that case:

- verify the task branch exists on `origin`
- verify the PR base is the epic branch
- manually confirm the PR is associated with the issue
- if GitHub still does not populate `Linked pull requests`, correct the linkage before relying on the board state

## GitHub automation notes

Use these notes when the tracker workflow is executed through `gh` or GraphQL instead of the browser.

When a task reveals a stable command sequence, API query, mutation, or workaround that is likely to be reused, add that note here while the details are fresh instead of leaving it only in chat history.

### Single local checkout

Default workflow uses one local checkout of the repository.

Operational rule:

- switch branches inside the same local directory instead of creating separate task folders
- before switching tasks or branches, keep the worktree clean by committing the current logical unit or explicitly coordinating any remaining local changes
- use alternate local folders or `git worktree` only when the user explicitly requests that setup

### Linked branches

To inspect linked branches for an issue:

```sh
gh issue develop --list 137 --repo petrukhinevg/gitTrainer
```

If the target branch does not exist yet, `gh issue develop` can create and register it.

If the remote branch already exists, GitHub may refuse to backfill the linkage. In that case, create a new linked branch name first and open the PR from that linked branch instead of expecting the existing branch name to become linked retroactively.

The GraphQL mutation that worked for creating a linked branch on a new name is:

```graphql
mutation($issueId: ID!, $repoId: ID!, $oid: GitObjectID!, $name: String!) {
  createLinkedBranch(
    input: {issueId: $issueId, repositoryId: $repoId, oid: $oid, name: $name}
  ) {
    linkedBranch {
      ref {
        name
      }
    }
  }
}
```

Required inputs:

- `issueId`: GraphQL issue ID from `gh issue view <number> --json id`
- `repoId`: GraphQL repository ID from `gh repo view <owner>/<repo> --json id`
- `oid`: commit SHA that the linked branch should point to
- `name`: new remote branch name such as `linked/137-catalog-browse-api-shell-stub-boundary`

Observed behavior:

- creating a linked branch on a fresh remote branch name worked
- attempting to register an already existing remote branch name did not backfill reliably

### Pull requests against epic branches

For child task PRs with the epic branch as `base`, use `Refs #<issue>` in the PR body to keep the issue association without relying on default-branch closing behavior.

Clarification:

- `Closes #<issue>`, `Fixes #<issue>`, and `Resolves #<issue>` create the GitHub linkage shown as a pull request that will close the issue after merge into the default branch
- `Refs #<issue>` keeps the PR associated with the issue without requesting auto-close
- a plain `#<issue>` mention or `Refs #<issue>` is not the same as a closing linkage and may only appear in the timeline as a mention/reference
- for PRs with `main` as `base`, use a closing keyword when the PR is intended to close the issue
- for PRs with an epic branch as `base`, use `Refs #<issue>` instead of a closing keyword

Example:

```sh
gh pr create \
  --base epic/98-scenario-catalog-browsing-mvp \
  --head linked/137-catalog-browse-api-shell-stub-boundary \
  --title "#137 Deliver catalog browse API shell and deterministic stub boundary" \
  --body "Refs #137"
```

Example for a standalone PR to `main` that should close its issue:

```sh
gh pr create \
  --base main \
  --head task/227-translate-documentation-to-russian \
  --title "#227 Translate repository documentation to Russian" \
  --body "Closes #227"
```

If a closed PR already exists for the same head and base and GitHub refuses to reopen it, create a new alias branch at the same commit and open a fresh PR from that alias branch instead of rewriting history.

### `Linked pull requests` field

Even after a linked branch and matching PR exist, the project field `Linked pull requests` may lag or may still require manual issue association for non-default-target PRs.

Operational rule:

- if the PR targets `main`, do not move a task to `Review` until the PR is actually visible in the `Linked pull requests` field
- if the PR targets `main` and the field is still empty, keep the task in `In Progress` even if code and tests are done
- if the PR targets a non-`main` base such as an epic branch, do not block the move to `Review` on the field being empty
- if automatic linkage does not populate the field for a non-`main` PR, complete the manual association in the GitHub UI as follow-up metadata work instead of blocking the board transition

Observed limitation:

- even after creating a fresh linked branch through `gh issue develop`, pushing the task commit onto that linked branch, and opening a PR with `Refs #<issue>` against an epic branch, the project field may still remain empty
- in that state, GitHub can already show a cross-reference from the issue timeline to the PR, but that is still not enough to treat `Linked pull requests` as satisfied
- when this happens for a PR that targets `main`, leave the task in `In Progress` and finish the remaining linkage through the GitHub UI before moving the task to `Review`
- when this happens for a PR that targets a non-`main` base, move the task to `Review` after the branch is pushed and the PR exists, then finish the remaining linkage through the GitHub UI

### Project status updates

When the project board status must be updated from the CLI, first inspect the project fields to get the current `Status` field id and option ids:

```sh
gh project field-list 4 --owner petrukhinevg
```

If `gh project item-list` output is not enough to identify the item's project card id, query it from the issue directly:

```sh
gh api graphql -f query='query {
  repository(owner: "petrukhinevg", name: "gitTrainer") {
    issue(number: 199) {
      projectItems(first: 10) {
        nodes {
          id
        }
      }
    }
  }
}'
```

Then update a single-select status value with:

```sh
gh project item-edit \
  --id <project-item-id> \
  --project-id <project-id> \
  --field-id <status-field-id> \
  --single-select-option-id <status-option-id>
```

### Follow-up child tasks after seam work

If a later child task depends on a seam that was delivered in an earlier child branch rather than in the initial epic baseline, do not start the later task from the old epic head.

Instead:

1. review the blocking child task
2. merge that reviewed child branch into the epic branch
3. create the next child branch from the updated epic head

This exception is allowed when the later task is genuinely blocked without that integrated seam.

## Task template

- Title: short and concrete
- Result: what becomes possible after completion
- Done criteria: 2-5 testable points
- Constraints: what is out of scope
- Side: `backend`, `frontend`, `fullstack`, `content`, or another project-specific label
- Labels: assign the correct project labels for the task's actual scope when the issue is created

## Parent issue template

- Title: large product or platform area
- Goal: what complete block is being built
- `Sub-issues`: each should provide an independent testable result
- Boundary: what stays out of scope
- Order: recommended implementation sequence
