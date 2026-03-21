# Baseline для эпика 324

## Назначение

Этот документ фиксирует стартовую линию для эпика [#324](https://github.com/petrukhinevg/gitTrainer/issues/324) и подзадачи `#326`.
Его цель — отделять реальные регрессии от плановых refactoring-изменений в backend, frontend и локальном runtime.

## Зафиксировано 2026-03-21

### Команды и runtime

- `./gradlew check` завершился успешно.
- `./gradlew bootRun` успешно поднимает приложение на `http://localhost:8083` при доступном локальном Postgres.
- `./gradlew bootRunPostgres` успешно:
  - проверяет Docker daemon;
  - поднимает `docker-compose.postgres.yml`;
  - дожидается `healthy` для контейнера `git-trainer-postgres`;
  - запускает Spring Boot с профилем `postgres` на `http://localhost:8083`.
- И `bootRun`, и `bootRunPostgres` валидируют 2 Flyway migration и не требуют дополнительных миграций поверх схемы `public`.
- Корень `/` отдаёт SPA shell с `index.html`, `/app.js` и `/app.css`.

### Live smoke path

Через поднятый runtime подтверждён happy path без переключения source:

1. `GET /api/scenarios`
2. `GET /api/scenarios/branch-safety`
3. `POST /api/sessions`
4. `POST /api/sessions/{sessionId}/submissions`
5. `GET /api/progress`

Проверенный сценарий:

- `scenarioSlug = branch-safety`
- корректная команда: `git branch --show-current`
- после успешной отправки `/api/progress` показывает:
  - `status = completed`
  - `attemptCount = 1`
  - `completionCount = 1`
  - `recentActivity.eventType = completed`

## Инварианты API

### `/api/scenarios`

- Возвращает JSON с `items[]` и `meta`.
- Каждый item содержит как минимум `id`, `slug`, `title`, `summary`, `difficulty`, `tags[]`.
- `meta.source` остаётся явным.
- `meta.query` присутствует и отражает shape входного фильтра даже при пустом запросе.

### `/api/scenarios/{slug}`

- Возвращает detail boundary с `id`, `slug`, `title`, `summary`, `difficulty`, `tags[]`, `meta`, `workspace`.
- `workspace.shell` содержит заголовки левой, центральной и правой колонок.
- `workspace.task` содержит `status`, `goal`, `instructions[]`, `steps[]`, `annotations[]`.
- `workspace.repositoryContext` содержит `status`, `branches[]`, `commits[]`, `files[]`, `annotations[]`.

### `/api/sessions`

- Успешный старт возвращает `201 Created`.
- Тело содержит `sessionId`, `scenario`, `lifecycle`, `submission`.
- `submission` фиксирует текущий transport boundary:
  - `supportedAnswerTypes[]`
  - `placeholderOutcome`
  - `placeholderRetryFeedback`
- Ошибки старта сессии возвращают machine-readable problem payload минимум с:
  - `title`
  - `detail`
  - `code`
  - `failureDisposition`
  - `retryable`

### `/api/sessions/{sessionId}/submissions`

- Успешная отправка возвращает `200 OK`.
- Тело содержит `submissionId`, `sessionId`, `attemptNumber`, `submittedAt`, `lifecycle`, `answer`, `outcome`, `retryFeedback`.
- `outcome` остаётся отдельным блоком от `retryFeedback`.
- `retryFeedback.retryState`, `retryFeedback.explanation` и `retryFeedback.hint` остаются обязательной частью evaluated response.

### `/api/progress`

- Возвращает JSON с `items[]`, `recentActivity[]`, `recommendations`, `meta`.
- Каждый item содержит как минимум `scenarioSlug`, `scenarioTitle`, `status`, `attemptCount`, `completionCount`, `lastActivityAt`.
- `recommendations` сохраняет shape:
  - `solved[]`
  - `attempted[]`
  - `next`
  - `rationale`

## Инварианты SPA

- Для `http/https` origin frontend по умолчанию стартует с provider `backend-api`.
- Поддерживаемые маршруты baseline:
  - `#/catalog`
  - `#/exercise/<slug>`
  - `#/progress`
- Экран упражнения не требует отдельного page reload:
  - detail loading;
  - session bootstrap;
  - submit;
  - retry feedback;
  - progress screen.
- SPA shell продолжает содержать стабильные markers для:
  - catalog controls;
  - route surfaces;
  - practice surface;
  - retry feedback panel;
  - progress summary.

## Опорные тесты baseline

- `src/test/java/com/example/gittrainer/app/CatalogShellPageTest.java`
- `src/test/java/com/example/gittrainer/app/MvpLifecycleFlowTest.java`
- `src/test/java/com/example/gittrainer/scenario/api/ScenarioCatalogControllerTest.java`
- `src/test/java/com/example/gittrainer/session/api/SessionControllerTest.java`
- `src/test/java/com/example/gittrainer/progress/api/ProgressControllerTest.java`
- `frontend/test/catalog-provider-recovery.test.js`
- `frontend/test/workspace-smoke-flow.test.js`

## Ограничения и операционные заметки

- Базовый runtime использует `server.port=8083`, а не `8082`.
- Оба запуска, `bootRun` и `bootRunPostgres`, корректно падают при занятом `8083`; это обычное ограничение текущего локального runtime, а не специальная логика приложения.
- `bootRun` без профиля `local-memory` зависит от доступности локального Postgres.
- Browser E2E в baseline не добавлялся; вместо него зафиксирован controller-level smoke path SPA и live HTTP smoke path для поднятого backend.
