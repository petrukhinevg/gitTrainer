# Дорожная карта бэкенда

## Роль

- Backend - source of truth для scenarios, sessions, validation, hints и progress.

## Правила

- Здесь только task-ready backend-задачи.
- Одна задача = один законченный backend-результат.
- Общие seam для нескольких задач выноси в baseline epic commit.
- Предпочитай независимые задачи от baseline эпика; парные frontend-задачи отмечай номером.

## MVP для бэкенда

1. Каталог сценариев.
2. Сессия упражнения.
3. Проверка ответа и feedback.
4. Retry и hints.
5. Progress и recommendations.

## Parent issues

### Родительская задача 1. Бэкенд для просмотра каталога сценариев

Цель: дать backend-срез для первого MVP-каталога.

- 1.1 Browse API shell: endpoint, DTO, stub adapter. Пара: frontend 1.1.
- 1.2 Query policy: filtering, sorting, empty state. Пара: frontend 1.2.
- 1.3 Summary content and fixtures: initial scenarios, normal/empty/unavailable source. Пара: frontend 1.3.

### Родительская задача 2. Бэкенд для контекста упражнения и рабочего пространства

Цель: дать backend-срез для открытия упражнения и показа контекста.

- 2.1 Detail API shell: endpoint, DTO, stub workspace payload. Пара: frontend 2.1.
- 2.2 Task content model: instructions, steps, goal text, static annotations. Пара: frontend 2.2.
- 2.3 Repo context model: branches, commits, files и другие cues для MVP-сценариев. Пара: frontend 2.3.

### Родительская задача 3. Бэкенд для отправки ответа и проверки корректности

Цель: дать backend-срез для отправки ответа и первичной валидации.

- 3.1 Session lifecycle and submit boundary: start session, submit answer, placeholder results. Backend-only.
- 3.2 Validation model: first answer types, correct/incorrect/partial/unsupported results. Пара: frontend 3.3.
- 3.3 Submit error policy: request errors, retryable vs terminal, unsupported mapping. Пара: frontend 3.2.
- 3.4 Session-backed repo state: execute supported commands and return normalized repo graph payload. Пара: frontend 3.7.

### Родительская задача 4. Бэкенд для управляемых повторных попыток и подсказок

Цель: дать backend-срез для обучающих повторных попыток.

- 4.1 Retry state: counters and retry allowance rules. Пара: frontend 4.1.
- 4.2 Explanation and hint policy: wrong/partial answers и progressive hints. Пара: frontend 4.2.
- 4.3 Retry feedback boundary: attempt state, explanation, hint level, retry allowance. Пара: frontend 4.3.

### Родительская задача 5. Бэкенд для прогресса и подсказок следующего шага

Цель: дать backend-срез для прогресса и рекомендаций.

- 5.1 Attempt storage: attempt results, completion events, in-progress state. Backend-only.
- 5.2 Progress summary: completion markers, in-progress, recent activity. Пара: frontend 5.2.
- 5.3 Recommendation policy: solved/tried/next exercises и recommendation payload. Пара: frontend 5.3.
