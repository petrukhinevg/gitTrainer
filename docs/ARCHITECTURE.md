# Архитектура

## Верхний уровень

- Monorepo: Spring Boot backend + `frontend/` SPA.
- Backend может отдавать собранную SPA.
- `docs/` хранит roadmap, workflow и архитектуру.

## Слои backend

- Базовый пакет: `src/main/java/com/example/gittrainer`.
- Код дели по бизнес-возможностям, а не по framework-слоям.
- `app`: bootstrap и конфигурация.
- `common`: общие примитивы.
- `<capability-name>`: одна бизнес-возможность.

## Шаблон capability

`com.example.gittrainer.<capability-name>`

- `domain`
- `application`
- `api`
- `infrastructure`

Используй только нужные подпакеты, но сохраняй единое именование.

## Планируемые capability

- `scenario`
- `session`
- `validation`
- `progress`

## Правила

- Предметный код держи внутри своей capability.
- Общий код держи в `common`.
- Framework/bootstrap concerns держи в `app`.
- Избегай верхнеуровневых bucket вроде `service`, `util`, `manager`, `repository`.
- Не смешивай controller, persistence и domain logic в одном классе.

## Граница frontend/backend

- Backend: scenarios, sessions, validation, hints, progress, API contracts.
- Frontend: routing, workspace state, input, repo visualization, progress UI.
- Backend остаётся source of truth; frontend может делать лёгкую UX-валидацию.
- Изменения на обеих сторонах начинай с API-контракта.

## Тестирование

- Доменную и application-логику тестируй рядом с capability.
- API тестируй на controller/integration уровне.
- Валидацию Git-ответов покрывай success и failure сценариями.
- Frontend должен опираться на явные backend-контракты.
