# Дорожная карта фронтенда

## Роль

- Frontend - SPA flow от каталога к упражнению, проверке и прогрессу.

## Правила

- Здесь только task-ready frontend-задачи.
- Одна задача = один законченный UI/state/integration результат.
- Общие seam выноси в baseline epic commit.
- Предпочитай независимые задачи от fixtures или стабильных контрактов; парные backend-задачи отмечай номером.

## UI-рамки

- тип: SPA
- рабочая поверхность: сценарий, ввод ответа, feedback
- адаптивность: desktop first, tablet-ready, mobile для чтения и лёгких действий
- доступность: keyboard-friendly, статус не только цветом, читабельная типографика для Git-команд

## MVP для фронтенда

1. Catalog SPA flow.
2. Exercise screen с задачей и контекстом.
3. Submit answer и feedback без ухода со страницы.
4. Видимый progress и next step.

## Parent issues

### Родительская задача 1. Фронтенд для просмотра каталога сценариев

Цель: дать frontend-срез для просмотра и выбора упражнений.

- 1.1 Catalog route shell and provider seam with fixtures. Пара: backend 1.1.
- 1.2 Request state: loading, filters, sort, empty, unavailable. Пара: backend 1.2.
- 1.3 Catalog rendering: scenario list, tags, difficulty, entry actions. Пара: backend 1.3.

### Родительская задача 2. Фронтенд для контекста упражнения и рабочего пространства

Цель: дать frontend-срез для открытия упражнения и понимания контекста.

- 2.1 Exercise route, workspace shell, detail provider seam. Пара: backend 2.1.
- 2.2 Task instructions and ordered steps. Пара: backend 2.2.
- 2.3 Repo context surfaces. Пара: backend 2.3.
- 2.4 Three-column lesson layout. Frontend-only.
- 2.5 Navigation rail and focused lesson view. Frontend-only.

### Родительская задача 3. Фронтенд для отправки ответа и проверки корректности

Цель: дать frontend-срез для отправки ответа и первичной обратной связи.

- 3.1 Answer input shell and local draft state. Frontend-only.
- 3.2 Submit transport and request states. Пара: backend 3.3.
- 3.3 Correctness rendering, включая unsupported answer. Пара: backend 3.2.
- 3.4 Practice surface в правой колонке: input + branch/output state. Frontend-only.
- 3.5 Independent scrolling columns. Frontend-only.
- 3.6 Responsive shell без content-driven nav width. Frontend-only.
- 3.7 Dynamic commit graph viewer. Пара: backend 3.4.

### Родительская задача 4. Фронтенд для управляемых повторных попыток и подсказок

Цель: дать frontend-срез для обучающих повторных попыток.

- 4.1 Feedback panel shell and preserved exercise context. Пара: backend 4.1.
- 4.2 Explanations and progressive hint interactions. Пара: backend 4.2.
- 4.3 Retry integration and retry-state transitions. Пара: backend 4.3.

### Родительская задача 5. Фронтенд для прогресса и подсказок следующего шага

Цель: дать frontend-срез для прогресса и рекомендаций.

- 5.1 Progress surfaces and status markers. Frontend-only.
- 5.2 Progress summary integration and activity states. Пара: backend 5.2.
- 5.3 Recommendation view and next-step UX. Пара: backend 5.3.
