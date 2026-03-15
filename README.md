# gitTrainer

`gitTrainer` is a web application for practicing Git through interactive training scenarios. The target product is a single-page app where a learner chooses an exercise, studies the repository situation, submits a Git action, and receives validation with explanations.

The repository currently contains a Spring Boot 4 backend on Java 21 and a standalone `frontend/` SPA workspace that is built into the backend static resources for production delivery.

Frontend workflow:

- `cd frontend && npm install` to install dependencies
- `cd frontend && npm run dev` to run the local SPA dev server
- `cd frontend && npm run build` to create the production bundle
- `./gradlew check` to verify backend tests and frontend build integration together

Core project documents:

- `LOCAL_AGENT_START.md`: fast bootstrap for each new session
- `AGENTS.md`: repository operating rules and git workflow
- `docs/ROADMAP.md`: shared product roadmap and MVP definition
- `docs/ARCHITECTURE.md`: package boundaries and system ownership
- `docs/BACKEND_ROADMAP.md`: backend delivery plan
- `docs/FRONTEND_ROADMAP.md`: frontend delivery plan
- `docs/TRACKER_WORKFLOW.md`: task decomposition and tracker flow
- `docs/BOARD.md`: local board snapshot
