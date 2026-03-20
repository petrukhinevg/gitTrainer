# Локальный старт агента

Используй этот файл как точку входа в репозиторий для каждого нового чата.

## Кратко о проекте

- Продукт: SPA для практики Git через интерактивные сценарии.
- Репозиторий: Spring Boot backend + `frontend/` в одном Gradle-проекте.
- Основные каталоги: `src/main/java`, `src/test/java`, `src/main/resources`, `frontend/`, `docs/`.

## Читай всегда

1. `docs/ROADMAP.md` для границ продукта, MVP и product-level задач.
2. `docs/ARCHITECTURE.md` для границ backend/frontend и правил размещения кода.

## Открывай по задаче

- `AGENTS.md`: жёсткие repo-wide инварианты.
- `docs/agent/OPERATING_RULES.md`: токены, `.env`, локальный каталог, поддержка инструкций.
- `docs/agent/REVIEW_GUIDELINES.md`: repo-specific правила code review.
- `docs/TRACKER_WORKFLOW.md`: scope, декомпозиция, parent/sub-issue, шаблоны задач.
- `docs/agent/GIT_WORKFLOW.md`: ветки, коммиты, push, PR, проверки перед push.
- `docs/agent/BOARD_WORKFLOW.md`: labels, статусы issue и handoff на project board.
- `docs/agent/GITHUB_AUTOMATION.md`: переиспользуемые `gh` и GraphQL-команды.
- `docs/BACKEND_ROADMAP.md`: backend-only задачи и декомпозиция API или данных.
- `docs/FRONTEND_ROADMAP.md`: frontend-only задачи и декомпозиция UX или UI.
- `.env`: только если действительно нужны локальные креды или токены.

## Напоминания

- `AGENTS.md` хранит только repo-wide инварианты.
- Не описывай репозиторий как backend-only без проверки `frontend/`.
