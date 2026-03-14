# Project Board

Local description of the project board for `gitTrainer`.

Repository: https://github.com/petrukhinevg/gitTrainer

Online board: https://github.com/users/petrukhinevg/projects/4

## Transitional note

- `#40` Rework roadmap for independent vertical epics is the current planning task in progress.
- The issue set below still reflects the older epic decomposition and must be refreshed after the roadmap rework is accepted.
- Until that refresh happens, treat the roadmap documents as the source of truth for future issue creation.

## Columns
- `Backlog`: everything captured but not ready for implementation
- `Ready`: tasks with a clear result and acceptance criteria
- `In Progress`: active implementation
- `Review`: implemented and waiting for review
- `Done`: accepted and completed

### Ready

- `#20` Parent Issue 1. Training scenario foundation
- `#21` Sub-issue 1.1. Create scenario identity and metadata objects
- `#22` Sub-issue 1.2. Create exercise step and instructional content objects
- `#23` Sub-issue 1.3. Model expected-outcome objects for validation targets
- `#24` Sub-issue 1.4. Model repository state snapshot objects
- `#25` Sub-issue 1.5. Assemble scenario aggregate rules
- `#26` Sub-issue 1.6. Add in-memory catalog loading for MVP scenarios

### Backlog

- `#27` Sub-issue 1.7. Add resource-backed catalog loading seam
- `#28` Sub-issue 1.8. Seed status inspection scenarios in the catalog
- `#29` Sub-issue 1.9. Seed branch creation and switching scenarios in the catalog
- `#30` Sub-issue 1.10. Seed history inspection scenarios in the catalog
- `#31` Sub-issue 1.11. Seed rebase starter scenarios in the catalog
- `#32` Sub-issue 1.12. Seed conflict-resolution starter scenarios in the catalog
- `#33` Sub-issue 1.13. Define client-side scenario summary and detail view models
- `#34` Sub-issue 1.14. Add frontend scenario fixture and loading seam
- `#35` Sub-issue 1.15. Add scenario metadata presentation primitives
- `#36` Sub-issue 1.16. Add exercise content presentation primitives
- `#37` Sub-issue 1.17. Add repository context presentation primitives

## Update rule

- New work should first be recorded in the roadmap or issue list.
- When a task is taken into work, move it to `In Progress`.
- After implementation, move it to `Review`.
- After acceptance, move it to `Done`.
