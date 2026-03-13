# Repository Agent Instructions

This file contains repository-wide operating rules. For every new chat, start with `LOCAL_AGENT_START.md`; it provides the fast bootstrap and routes you to the right project documents.

## New Chat Bootstrap

1. Read `LOCAL_AGENT_START.md`.
2. Follow the session routing in that file and open only the documents needed for the current task.
3. Return to this file for repository rules, local credential handling, and agent-specific execution constraints.

## Local Files And Credentials

- Do not commit `LOCAL_AGENT_START.md` or `.env`.
- Use `GIT_USERNAME` and `GIT_TOKEN` for git and remote platform actions if authenticated operations are needed.
- Use admin credentials only for owner-level repository actions.
- Do not rely on password auth unless explicitly required.
- Check `.env` only when the task needs local credentials or tokens.

## Workflow Pointers

- Use `docs/TRACKER_WORKFLOW.md` as the single source of truth for task decomposition, branch flow, PR flow, board states, child-task WIP handling, and merge timing.
- Do not push to `origin` until the user explicitly asks for it.
- Use the commit format defined in `docs/TRACKER_WORKFLOW.md`: `number_ShortCommitDescription` for the main implementation commit of a task.
- When working inside an epic, always branch each child task from the epic branch itself, never from another child task branch.
- Do not move `main` or the epic branch forward locally just to continue development on later child tasks.
- Keep review fixes in the same task branch. Do not create a separate review-fix branch.
- When needed, add one follow-up commit with a `review fix` postfix.
- The existing project field for PR visibility is `Linked pull requests`. Do not create a custom replacement field unless the project setup changes.

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
- Use the roadmap documents as a source for new issues.
- If the requested change is not described there yet, update roadmap or board notes before starting large implementation work.
