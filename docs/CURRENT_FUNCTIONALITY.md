# Функциональное описание проекта

Актуально по состоянию репозитория на 2026-04-05.

Этот файл заменяет roadmap-документы как стартовую сводку проекта. Используй его в новом чате, чтобы быстро понять, что уже есть в системе, на что можно опираться без перепридумывания и какие части проекта готовы к доработке.

## 1. Что это за продукт

`gitTrainer` - это SPA для практики Git через короткие интерактивные сценарии.

Текущая продуктовая модель:

- пользователь открывает каталог сценариев;
- выбирает упражнение;
- читает задачу и контекст репозитория;
- запускает тренировочную сессию;
- отправляет один Git-ответ в виде команды;
- получает результат проверки, пояснение и подсказки;
- видит накопленный прогресс и рекомендацию следующего шага.

Технически это monorepo:

- backend на Spring Boot 4 и Java 21;
- frontend в `frontend/` на Vite и нативном JS;
- backend может отдавать собранную SPA как статические ресурсы.

## 2. Что реально работает сейчас

### Каталог сценариев

- Есть API `GET /api/scenarios`.
- Есть фильтрация по `difficulty`.
- Есть фильтрация по нескольким `tag`.
- Есть сортировка.
- Есть empty/error boundary.
- Во frontend есть маршрут `#/catalog`.
- Каталог умеет предзагружать детали сценариев после получения списка.

### Экран упражнения

- Есть API `GET /api/scenarios/{slug}`.
- Во frontend есть маршрут `#/exercise/<slug>`.
- Есть shortcut-маршрут `#/sandbox`, который ведёт на сценарий `merge-sandbox-outline`.
- Экран построен как трёхзонная рабочая поверхность:
  - слева навигация по сценарию;
  - по центру урок и описание шага;
  - справа практика и живой снимок репозитория.
- В detail payload уже есть:
  - `goal`;
  - `instructions[]`;
  - `steps[]`;
  - `annotations[]`;
  - `repositoryContext` с ветками, коммитами, файлами и подсказками.

### Сессия и отправка ответа

- Есть API `POST /api/sessions`.
- Есть API `POST /api/sessions/{sessionId}/submissions`.
- При старте сессии backend создаёт отдельный workspace в файловой системе.
- После отправки ответа backend:
  - валидирует ответ;
  - сохраняет submission;
  - сохраняет validation run;
  - обновляет progress;
  - возвращает новый snapshot workspace.
- Поддерживаемый `answerType` сейчас только один: `command_text`.
- Поддерживаемые исходы проверки:
  - `correct`;
  - `partial`;
  - `incorrect`;
  - `unsupported`.

### Retry, explanation и hints

- После неуспешной попытки возвращается `retryFeedback`.
- В `retryFeedback` уже есть:
  - `retryState`;
  - `explanation`;
  - `hint`.
- Подсказки прогрессивные.
- Более сильная подсказка открывается после двух подряд неуспешных попыток.
- Во frontend уже есть UI для:
  - повторной отправки;
  - перезапуска сессии;
  - поэтапного раскрытия hint reveal-элементов.

### Live workspace

- В start/submission ответах backend возвращает snapshot текущего session-backed репозитория.
- Snapshot строится чтением реального git workspace.
- В snapshot сейчас попадают:
  - текущие ветки;
  - последние коммиты;
  - commit graph;
  - изменённые файлы;
  - служебные аннотации;
  - косвенные сигналы по stash и tag count.
- Во frontend это уже отображается в practice viewer и сопутствующих карточках состояния.

### Прогресс

- Есть API `GET /api/progress`.
- Во frontend есть маршрут `#/progress`.
- Сейчас экран прогресса показывает:
  - статус по каждому сценарию;
  - число попыток;
  - число завершений;
  - недавнюю активность;
  - рекомендации по следующему шагу.
- Текущая recommendation policy:
  - если есть начатые сценарии, рекомендуем продолжить самый актуальный;
  - иначе рекомендуем следующий не начатый;
  - если всё завершено, рекомендуем вернуться к последнему активному сценарию.

## 3. Текущий authored-контент

В проекте сейчас заведено 7 authored-сценариев:

- `status-basics` - "Проверь изменения перед первым Git-действием"
- `branch-safety` - "Подтверди ветку и незавершённый hotfix"
- `history-cleanup-preview` - "Собери preview истории перед cleanup"
- `remote-sync-preview` - "Сначала обнови `origin/main` перед интеграцией"
- `stash-checkpoint-draft` - "Убери черновик в stash перед переключением"
- `merge-sandbox-outline` - "Сравни diff перед попыткой merge"
- `tag-checkpoint-preview` - "Проверь релизные теги перед выбором точки"

По сложности сейчас есть как минимум:

- `BEGINNER`
- `INTERMEDIATE`

По данным сценариев уже хранятся:

- summary для каталога;
- task content;
- repository context;
- retry guidance profile;
- validator specs и validator rules.

Основной authored source сейчас выглядит как `db-seeded`.

## 4. Backend: что именно реализовано

Backend уже разбит по capability:

- `scenario`
- `session`
- `validation`
- `progress`
- `app`
- `common`

Что важно по backend-поведению:

- `scenario` отдаёт каталог и детали сценариев.
- `session` управляет жизненным циклом тренировочной сессии и submission boundary.
- `validation` умеет валидировать Git-ответы и сохранять validation telemetry.
- `progress` считает summary, recent activity и recommendations.
- `app` содержит bootstrap и общую HTTP-обвязку.

Текущие стабильные backend boundary:

- `GET /api/scenarios`
- `GET /api/scenarios/{slug}`
- `POST /api/sessions`
- `POST /api/sessions/{sessionId}/submissions`
- `GET /api/progress`

Текущая persistence/runtime-модель main-кода:

- production-код ориентирован на Postgres;
- schema управляется Flyway migration-ами `V1`-`V9`;
- сценарии, retry templates, validator specs, submissions, progress и validation runs уже имеют DB-слой;
- workspace сессии живёт в файловой системе вне БД.

## 5. Валидация ответов

Сейчас в проекте есть два основных режима валидации ответа.

### In-process path

- По умолчанию активен `PostgresSubmissionAnswerValidator`.
- Он читает validator spec из БД.
- Для supported answer type использует rule/probe-логику внутри backend.

### CLI path

- Может быть включён через `gittrainer.validator.cli.enabled=true`.
- Использует `CliSubmissionAnswerValidator`.
- Передаёт request во внешний CLI-процесс через временный JSON-файл.
- Сохраняет runner failures как отдельный тип validation run.

Поддерживаемые validator type в текущем контуре:

- `exact_command_match`
- `git_command_probe`
- `git_repo_state_probe`

Поддерживаемый rule type:

- `exact_normalized_command`

Важно:

- backend остаётся source of truth для spec, retry feedback и telemetry;
- CLI не должен быть отдельным каталогом сценариев.

## 6. Frontend: что именно реализовано

Frontend уже не является простым прототипом каталога. В нём есть полноценный SPA flow:

- hash-routing;
- каталог;
- экран упражнения;
- экран прогресса;
- sandbox shortcut;
- связка detail -> session bootstrap -> submit -> retry feedback -> progress.

Что уже есть во frontend:

- единый controller для workspace shell;
- orchestration для route change, загрузки данных и session bootstrap;
- независимые surface для navigation / lesson / practice;
- sticky progress strip;
- route-aware навигация между сценариями;
- error/loading/empty состояния;
- нормализация API-ответов до стабильного UI shape;
- отрисовка commit graph, файлов и аннотаций;
- terminal/output presentation для результата отправки;
- progress cards, recent activity и recommendation shell.

Важное текущее ограничение:

- runtime-провайдер в `frontend/src` сейчас только один: `backend-api`.
- Исторические упоминания `local-fixture` в старой документации не подтверждаются текущим main-кодом frontend.

## 7. Что подтверждено тестами

По дереву репозитория сейчас видно:

- 38 backend test-файлов в `src/test/java`;
- 30 frontend test-файлов в `frontend/test`.

По названиям и уже имеющимся baseline-документам тестами покрываются как минимум:

- catalog boundary;
- scenario detail boundary;
- session lifecycle;
- submission flow;
- progress API;
- frontend smoke path catalog -> exercise -> submit -> progress;
- layout и interaction слои workspace shell.

Это не означает полную coverage-гарантию, но даёт хороший рабочий baseline для продолжения разработки.

## 8. Что готово к безопасному расширению

Ниже не roadmap, а реальные точки расширения, которые уже имеют опору в коде.

### Новый сценарий

Система уже готова к добавлению нового authored-сценария, если сделать связанный комплект данных:

- catalog summary;
- task content;
- repository context;
- retry guidance;
- validator spec;
- validation rules;
- при необходимости repo fixture и CLI/in-process probe.

### Новый тип проверки

Можно расширять validation слой:

- добавлять новые validator type;
- углублять state-based проверки;
- усиливать CLI path;
- сохранять совместимость текущего request/response контракта.

### Новый answer type

Контракты пока заточены под `command_text`, но boundary уже выделен явно через `supportedAnswerTypes`, поэтому добавить новый тип ответа можно без переделки всей модели с нуля.

### Развитие progress

Есть готовая точка для:

- более умных рекомендаций;
- richer activity timeline;
- дополнительных progress marker-ов;
- сегментации прогресса по difficulty/tag/curriculum.

### Развитие SPA UX

У frontend уже есть устойчивые seams для:

- улучшения practice viewer;
- richer terminal experience;
- улучшения навигации сценария;
- улучшения мобильной деградации;
- локальных анимаций и визуальных подсказок без смены API.

## 9. Что важно не перепутать в новом чате

- Не считай проект backend-only: в репозитории есть рабочий SPA frontend.
- Не считай roadmap источником правды: roadmap-документы удалены, источник правды теперь этот файл плюс код.
- Не считай `local-fixture` текущим runtime-вариантом frontend без дополнительной проверки.
- Не считай `local-memory` production-профилем backend без дополнительной проверки: в main-коде основной контур сейчас Postgres-backed.
- Backend остаётся source of truth для сценариев, сессий, validation и progress.
- Если задача затрагивает API или workspace flow, сначала смотри контракт, а не старые описания.

## 10. С чего начинать новый чат

Минимальный порядок чтения:

- этот файл;
- `docs/ARCHITECTURE.md`;
- `AGENTS.md`;
- дальше по задаче:
  - `docs/EPIC_324_BASELINE.md`, если нужна baseline-фиксация runtime/API;
  - `docs/CLI_VALIDATOR_CONTRACT.md`, если задача касается validator path;
  - `docs/TRACKER_WORKFLOW.md`, если нужно нарезать работу на issue;
  - `README.md`, если нужен локальный запуск и команды.

Быстрая ментальная модель для следующего чата:

- продукт уже работает как MVP-платформа для практики Git;
- основной happy path уже существует end-to-end;
- проект удобнее развивать через расширение authored content, validation и SPA UX, чем через перепроектирование базовой архитектуры;
- перед любыми крупными изменениями полезно сверять старые документы с текущим кодом, потому что часть исторических описаний уже отстаёт от main-состояния.
