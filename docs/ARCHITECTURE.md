# Architecture

## Goal

Define the minimum project structure needed so the Git training product can grow from a simple MVP into a maintainable learning platform without unclear ownership or mixed responsibilities.

## High-level structure

- Root project: single Spring Boot application that currently hosts backend code and may later serve the compiled SPA or expose APIs to a separate frontend app
- `frontend/`: planned SPA client for the training workspace; add only when UI implementation starts as a separate application
- `docs/`: roadmap, workflow, architecture decisions
- Other important folders: `src/main/java` for application code, `src/test/java` for backend tests, `src/main/resources` for configuration and future static content

## Backend layers

Backend code lives under `src/main/java/com/example/gittrainer` and should be split by business capability, not by framework artifact type.

- `app`: application bootstrap, configuration, health endpoints, and shared technical wiring
- `common`: shared primitives used by multiple features, such as error models, clock abstractions, IDs, and shared validation helpers
- `<capability-name>`: all code for one business capability, named after what the capability actually is

## Capability package template

New business work should be placed under:

`com.example.gittrainer.<capability-name>`

Recommended internal structure:

- `domain`: exercise definitions, value objects, enums, scoring rules, and domain services
- `application`: use cases for starting sessions, validating answers, returning hints, and tracking completion
- `api`: controllers, request DTOs, response DTOs, and contract mappers
- `infrastructure`: persistence, exercise catalog loading, storage access, and technical adapters

Use only the packages the capability actually needs, but keep naming consistent.

## Planned backend capability areas

Use business-oriented package names tied to the training product. Do not add a generic `feature` segment to the package path.

- `scenario` for exercise catalog, difficulty, tags, and scenario metadata
- `session` for active training attempts, user progress, and step state
- `validation` for checking Git commands, expected outcomes, and explanation generation
- `progress` for summaries, streaks, scoring, and completion history

## Package placement rules

- Business-specific code belongs inside its capability package, not in shared buckets.
- Shared code used by multiple features belongs in `common`.
- Framework/bootstrap concerns belong in `app`.
- Avoid generic buckets such as `service`, `util`, `manager`, or `repository` at the top level unless the project deliberately adopts that convention later.
- Avoid mixing controller, persistence, and domain logic in one class.

## Frontend/backend boundary

- Backend owns: scenario catalog, validation rules, exercise progression, scoring, hints, persistence, and API contracts
- Frontend owns: route-level flow, training workspace state, input handling, visual explanation of repository state, and progress presentation
- Frontend may mirror lightweight validation for immediate UX feedback, but backend remains the source of truth for whether a learner solved the task correctly.
- If a capability changes both sides, define the API contract first and then wire the consumer side to it.

## Testing guidance

- Domain and application logic should have focused tests near the capability they cover.
- API behavior should be tested at controller or integration level once endpoints exist.
- Validation logic for Git answers should be tested with representative success and failure scenarios, not only happy paths.
- Frontend should keep UI concerns isolated from backend implementation details and rely on explicit contracts.
