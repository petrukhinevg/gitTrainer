# gitTrainer

`gitTrainer` — это веб-приложение для практики Git через интерактивные тренировочные сценарии. Целевой продукт представляет собой одностраничное приложение, в котором пользователь выбирает упражнение, изучает ситуацию в репозитории, отправляет Git-действие и получает проверку с объяснениями.

Сейчас в репозитории находятся backend на Spring Boot 4 и Java 21, а также отдельное SPA-пространство `frontend/`, которое в production-сборке встраивается в статические ресурсы backend.

## Требования

- Java 21
- Node.js и npm
- Docker Engine
- Colima, если Docker на машине работает через неё

## Полный локальный запуск с Postgres

### 1. Поднять Docker runtime

Если Docker у тебя работает через Colima, сначала запусти её:

```bash
colima start
```

Если используешь Docker Desktop, достаточно убедиться, что он уже запущен.

Проверка:

```bash
docker info
```

### 2. Поднять локальный Postgres

```bash
docker compose -f docker-compose.postgres.yml up -d
```

Проверка:

```bash
docker compose -f docker-compose.postgres.yml ps
```

Ожидаемый контейнер: `git-trainer-postgres`.

Если видишь ошибку вида:

```text
failed to connect to the docker API at unix:///Users/<user>/.colima/default/docker.sock
```

это означает, что выбран Docker context `colima`, но сама `colima` не запущена. Исправление:

```bash
colima start
docker compose -f docker-compose.postgres.yml up -d
```

### 3. Запустить приложение целиком

Из корня репозитория:

```bash
./gradlew bootRun
```

Эта команда:

- проверит, что `npm` доступен
- установит frontend-зависимости при необходимости
- соберёт SPA
- скопирует frontend-ассеты в classpath backend
- проверит, что `8083` свободен
- запустит Spring Boot на `http://localhost:8083`

Если `8083` уже занят, `bootRun` теперь падает заранее с понятным сообщением. На macOS и Linux в тексте также показывается process, который слушает порт.

Если нужен запуск с автоматическим `docker compose up`, ожиданием healthy-состояния Postgres и дополнительной диагностикой Docker runtime, используй:

```bash
./gradlew bootRunPostgres
```

`bootRunPostgres`:

- проверяет Docker daemon
- при активном context `colima` автоматически вызывает `colima start`
- поднимает `postgres` через `docker compose`
- ждёт healthy-состояние контейнера
- тоже валидирует свободный `8083`
- затем запускает backend с профилем `postgres`

### 4. Открыть приложение

- UI: `http://localhost:8083/`
- каталог сценариев API: `http://localhost:8083/api/scenarios`
- прогресс API: `http://localhost:8083/api/progress`

### 5. При необходимости переопределить доступы к Postgres

- `POSTGRES_URL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

Пример:

```bash
POSTGRES_URL=jdbc:postgresql://localhost:5432/git_trainer \
POSTGRES_USER=git_trainer \
POSTGRES_PASSWORD=git_trainer \
./gradlew syncFrontendAssets bootRun
```

## Быстрый запуск backend без Postgres

Если нужен локальный fallback без базы:

```bash
SPRING_PROFILES_ACTIVE=local-memory ./gradlew bootRun
```

## Изолированная работа с frontend

Если нужен только dev-сервер SPA:

```bash
cd frontend
npm install
npm run dev
```

Открывай `http://localhost:5173/`.

Важно:

- по умолчанию SPA стартует с источником данных `backend-api`
- Vite уже проксирует `/api` на `http://localhost:8083`
- если backend не запущен, запросы всё равно будут падать, поэтому в таком случае переключи источник данных в UI на `local-fixture`
- backend origin для dev-прокси можно переопределить через `BACKEND_DEV_ORIGIN`

Пример:

```bash
cd frontend
BACKEND_DEV_ORIGIN=http://localhost:8090 npm run dev
```

## Полезные команды

- `cd frontend && npm install` для установки frontend-зависимостей
- `cd frontend && npm run build` для production-сборки SPA
- `./gradlew check` для проверки backend-тестов и интеграции frontend-сборки
- `./gradlew test` для backend-тестов
- `./gradlew bootRunPostgres` для полного happy path с Docker/Postgres preflight
- `./gradlew postgresComposeDown` для остановки локального Postgres

## Остановка и сброс

Остановить backend:

```bash
Ctrl+C
```

Остановить Postgres:

```bash
docker compose -f docker-compose.postgres.yml down
```

Полностью сбросить локальную БД вместе с volume:

```bash
docker compose -f docker-compose.postgres.yml down -v
```
- `docker compose -f docker-compose.postgres.yml up -d` для запуска локальной БД
- `./gradlew bootRun` для запуска backend с Postgres-репозиториями и миграциями Flyway (runtime по умолчанию)
- `./gradlew bootRunPostgres` чтобы автоматически поднять docker compose, дождаться healthy-состояния Postgres и только потом запустить backend
- если активный Docker context указывает на `colima`, `bootRunPostgres` сначала автоматически выполнит `colima start`
- `./gradlew postgresComposeDown` чтобы остановить локальный контейнер Postgres
- можно переопределить доступы через `POSTGRES_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `SPRING_PROFILES_ACTIVE=local-memory ./gradlew bootRun` если нужен явный запуск без Postgres (только локальный fallback)
- в IntelliJ IDEA доступны shared run configuration:
  - `.run/GitTrainer Default.run.xml`
  - `.run/GitTrainer Postgres.run.xml`
  - `.run/GitTrainer Local Memory.run.xml`
  - `.run/GitTrainer Postgres Down.run.xml`

Основные документы проекта:

- `LOCAL_AGENT_START.md`: быстрый старт для каждой новой сессии
- `AGENTS.md`: жёсткие repo-wide инварианты
- `docs/agent/OPERATING_RULES.md`: локальные доступы, токены и поддержка инструкций
- `docs/agent/REVIEW_GUIDELINES.md`: правила code review
- `docs/ROADMAP.md`: общий roadmap продукта и определение MVP
- `docs/ARCHITECTURE.md`: границы пакетов и зоны ответственности системы
- `docs/BACKEND_ROADMAP.md`: план поставки backend-части
- `docs/FRONTEND_ROADMAP.md`: план поставки frontend-части
- `docs/TRACKER_WORKFLOW.md`: декомпозиция задач, рабочий workflow и гигиена scope
- `docs/EPIC_324_BASELINE.md`: baseline runtime, API и SPA-контрактов для рефакторинга
- `docs/agent/GIT_WORKFLOW.md`: ветки, коммиты, push, PR и проверки перед push
- `docs/agent/BOARD_WORKFLOW.md`: labels, parent/sub-issue и project board
- `docs/agent/GITHUB_AUTOMATION.md`: `gh`, GraphQL и GitHub automation notes
- `docs/BOARD.md`: локальный снимок доски проекта
