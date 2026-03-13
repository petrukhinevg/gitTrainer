# Repository Agent Instructions

This file contains repository-wide operating rules. For every new chat, start with `LOCAL_AGENT_START.md`; it provides the fast bootstrap and routes you to the right project documents.

## New Chat Bootstrap

1. Read `LOCAL_AGENT_START.md`.
2. Follow the session routing in that file and open only the documents needed for the current task.
3. Return to this file for repository rules, git workflow guardrails, and push/review requirements.

## Local Files And Credentials

- Do not commit `LOCAL_AGENT_START.md` or `.env`.
- Use `GIT_USERNAME` and `GIT_TOKEN` for git and remote platform actions if authenticated operations are needed.
- Use admin credentials only for owner-level repository actions.
- Do not rely on password auth unless explicitly required.
- Check `.env` only when the task needs local credentials or tokens.

## Branches, PRs, And Review Flow

- Treat `main` as the production branch.
- Create epic branches and standalone task branches from `main`.
- Create all child task branches for an epic directly from the epic branch.
- Do not push to `origin` until the user explicitly asks for it.
- Keep one logical task implementation in one task branch and one main implementation commit unless review fixes are needed.
- Keep review fixes in the same task branch. Do not create a separate review-fix branch.
- When needed, add one follow-up commit with a `review fix` postfix.
- When pushing an epic branch to `origin`, create or update the epic PR to `main` and link it to the epic issue.
- When pushing a task branch to `origin`, create or update exactly one PR for that branch against the epic branch.
- After creating or updating a task PR, manually link that PR to the corresponding task issue through the platform development linkage if auto-linking does not work for non-default targets.
- The existing project field for PR visibility is `Linked pull requests`. Do not create a custom replacement field unless the project setup changes.
- After creating or updating a task PR, verify that the task row shows that PR in the configured PR visibility field.
- Do not merge child task branches into the epic branch until those tasks pass review and move to `Done`.
- Merge the epic branch into `main` only after all included child tasks are `Done`.

## Validation Before Push

- Before each `git push`, run `./gradlew check`.
- If backend code changed, prefer `./gradlew test`.
- If a future `frontend/` directory exists and frontend code changed, run that app's production build command inside `frontend/` before push.

## Scope And Change Hygiene

- If local changes are already large, or work is switching to another task, commit the current logical unit first.
- Keep commits scoped: do not split one task into noisy micro-commits, but do not batch unrelated work together.
- For larger changes, prefer clear package boundaries and simple extensible structure.
- Keep business logic for Git training scenarios, validation, hints, and progress tracking inside capability packages named after the actual domain area instead of generic shared buckets.
- Use `docs/ARCHITECTURE.md` for backend/frontend boundaries.
- Move tasks to `Review` once the branch is in a reviewable state.
- Use the roadmap documents as a source for new issues.
- If the requested change is not described there yet, update roadmap or board notes before starting large implementation work.
