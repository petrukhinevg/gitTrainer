# Операционные правила репозитория

## Когда читать

- токены, `.env`, локальная среда, правки самих инструкций

## Доступы

- `GIT_USERNAME` и `GH_TOKEN` - для аутентифицированных git-операций.
- `GH_TOKEN` - для `gh`; при загрузке из `.env` используй `set -a && source .env && set +a`.
- Админские доступы - только для owner-level операций.
- `.env` открывай только когда реально нужны креды.

## Локальная среда

- Работай в текущем каталоге репозитория.
- Не создавай соседние клоны и `git worktree`, если пользователь не просил.

## Поддержка инструкций

- Не дублируй одно правило в нескольких документах.
- Workflow changes -> `docs/TRACKER_WORKFLOW.md`.
- Git/PR changes -> `docs/agent/GIT_WORKFLOW.md`.
- Board changes -> `docs/agent/BOARD_WORKFLOW.md` и при необходимости `docs/BOARD.md`.
- Stable `gh`/GraphQL команды -> `docs/agent/GITHUB_AUTOMATION.md`.
