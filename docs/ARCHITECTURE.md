# Архитектура

## Цель

Определить минимальную структуру проекта, достаточную для того, чтобы продукт по обучению Git мог вырасти из простого MVP в поддерживаемую платформу без размытой ответственности и смешения ролей.

## Структура верхнего уровня

- Корневой проект: единое Spring Boot application, которое сейчас хостит backend-код и позже может либо раздавать собранный SPA, либо работать как API для отдельного frontend-приложения
- `frontend/`: планируемый SPA-клиент для учебного workspace; добавляй и развивай его как отдельное приложение по мере роста UI
- `docs/`: roadmap, workflow, архитектурные решения
- Другие важные папки: `src/main/java` для application-кода, `src/test/java` для backend-тестов, `src/main/resources` для конфигурации и будущего статического контента

## Слои backend

Backend-код живёт под `src/main/java/com/example/gittrainer` и должен быть разбит по бизнес-возможностям, а не по типу framework-артефакта.

- `app`: bootstrap приложения, конфигурация, health endpoints и общее техническое wiring
- `common`: общие примитивы, используемые несколькими фичами, например error models, абстракции времени, IDs и shared validation helpers
- `<capability-name>`: весь код одной бизнес-возможности, названной по реальной предметной области

## Шаблон capability package

Новую бизнес-логику размещай под:

`com.example.gittrainer.<capability-name>`

Рекомендуемая внутренняя структура:

- `domain`: определения упражнений, value objects, enums, scoring rules и domain services
- `application`: use cases для запуска сессий, валидации ответов, возврата hints и трекинга completion
- `api`: controllers, request DTOs, response DTOs и contract mappers
- `infrastructure`: persistence, загрузка каталога упражнений, доступ к storage и технические адаптеры

Используй только те подпакеты, которые реально нужны конкретной capability, но сохраняй единый стиль именования.

## Планируемые capability-области backend

Используй бизнес-ориентированные имена пакетов, связанные с учебным продуктом. Не добавляй общий сегмент `feature` в package path.

- `scenario` для каталога упражнений, сложности, тегов и метаданных сценариев
- `session` для активных попыток обучения, пользовательского прогресса и step-state
- `validation` для проверки Git-команд, ожидаемых результатов и генерации объяснений
- `progress` для summary, streaks, scoring и истории завершения

## Правила размещения пакетов

- Бизнес-специфичный код должен жить внутри capability package, а не в общих корзинах.
- Shared code, используемый несколькими фичами, помещай в `common`.
- Framework/bootstrap concerns помещай в `app`.
- Избегай общих корзин верхнего уровня вроде `service`, `util`, `manager` или `repository`, если только проект осознанно не примет это соглашение позже.
- Не смешивай controller, persistence и domain logic в одном классе.

## Граница frontend/backend

- Backend отвечает за: каталог сценариев, правила валидации, progression упражнения, scoring, hints, persistence и API contracts
- Frontend отвечает за: route-level flow, состояние учебного workspace, обработку ввода, визуальное объяснение состояния репозитория и представление прогресса
- Frontend может зеркалить лёгкую валидацию ради мгновенного UX-feedback, но backend остаётся source of truth для решения, зачтено упражнение или нет
- Если capability затрагивает обе стороны, сначала определяй API contract, а затем подключай consumer-side

## Рекомендации по тестированию

- Domain и application logic должны иметь сфокусированные тесты рядом с той capability, которую они покрывают.
- API behavior стоит тестировать на controller или integration уровне, как только появляются endpoints.
- Validation logic для Git-ответов нужно проверять на репрезентативных success и failure сценариях, а не только на happy path.
- Frontend должен изолировать UI concerns от деталей backend-реализации и опираться на явные контракты.
