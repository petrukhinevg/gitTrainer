# Local Agent Start

Use this file as the bootstrap for every new chat in this repository.

## Product snapshot

- Product: single-page web application for learning and practicing Git through interactive scenarios, missions, and progress feedback
- MVP loop: choose a training scenario -> inspect the task and repository state -> enter or assemble Git actions -> get validation and explanation
- Backend owns: scenario definitions, exercise state, answer validation, progress tracking, scoring, hints, and explanation generation rules
- Frontend owns: SPA routing, training workspace UI, client-side interaction state, progress presentation, and feedback rendering

This project is aimed at learners who understand basic development workflows but want practical Git repetition in a safe environment. The app should help users understand not only which command to run, but also why that command fits the repository state and task goal.

## Repository snapshot

- Root project: single Gradle project with Spring Boot 4 and Java 21; currently backend-first with documentation for a future SPA frontend
- `frontend/`: planned future SPA workspace for the training interface; not present yet, so frontend work currently starts with roadmap and architecture updates
- `docs/`: roadmap, architecture, workflow, and local board notes
- Other important folders: `src/main/java` for backend application code, `src/test/java` for automated tests, `src/main/resources` for configuration and static assets when introduced

## Session routing

Read these documents in every new chat:

1. `docs/ROADMAP.md` for product scope, MVP boundaries, and task inventory.
2. `docs/ARCHITECTURE.md` for backend/frontend boundaries and package placement.

Read these only when the task needs them:

3. `AGENTS.md` for repository operating rules, git actions, push constraints, PR flow, review handling, and validation before push.
4. `docs/TRACKER_WORKFLOW.md` for issue flow, task decomposition, branch/PR flow, review state, or board updates.
5. `docs/BACKEND_ROADMAP.md` for backend-only work or API/data/model changes.
6. `docs/FRONTEND_ROADMAP.md` for frontend-only work or UX/UI changes.
7. `.env` only when the task needs local credentials or tokens.

## Action-based routing

- If the task changes product scope, MVP boundaries, or requires creating/refining work items, check `docs/ROADMAP.md`.
- If the task changes backend/frontend responsibilities or package placement, check `docs/ARCHITECTURE.md`.
- If the task involves git branches, commits, pushes, PR creation, review fixes, or pre-push checks, check `AGENTS.md`.
- If the task involves issue states, decomposition, parent/sub-issue structure, review status, or project board updates, check `docs/TRACKER_WORKFLOW.md`.
- If the task is backend-only, check `docs/BACKEND_ROADMAP.md`.
- If the task is frontend-only, check `docs/FRONTEND_ROADMAP.md`.
- If the task needs local credentials, tokens, or authenticated local tooling, check `.env`.

## Notes

- Repository-wide operating rules live in `AGENTS.md`; use this file only as the fast entry point and routing map.
- Keep local-only secrets in `.env`.
- There is no separate frontend application in the repository yet; do not assume `frontend/` exists unless it is added in a later task.
