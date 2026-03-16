# gitTrainer

`gitTrainer` — это веб-приложение для практики Git через интерактивные учебные сценарии. Целевой продукт — одностраничное приложение, в котором пользователь выбирает упражнение, изучает состояние репозитория, отправляет Git-действие и получает проверку с объяснениями.

Сейчас репозиторий содержит backend на Spring Boot 4 и Java 21, а также отдельное SPA-пространство `frontend/`, которое в production-сборке встраивается в статические ресурсы backend.

Рабочий цикл frontend:

- `cd frontend && npm install` — установить зависимости
- `cd frontend && npm run dev` — запустить локальный dev server SPA
- `cd frontend && npm run build` — собрать production bundle
- `./gradlew check` — проверить backend-тесты и интеграцию frontend-сборки вместе

Основные документы проекта:

- `LOCAL_AGENT_START.md`: быстрый bootstrap для каждой новой сессии
- `AGENTS.md`: правила работы с репозиторием и git workflow
- `docs/APPLICATION_PROGRAM.md`: текущее состояние продукта, пробелы и граница до первого демо
- `docs/ROADMAP.md`: общий roadmap продукта и определение MVP
- `docs/ARCHITECTURE.md`: границы пакетов и распределение ответственности в системе
- `docs/BACKEND_ROADMAP.md`: план поставки backend-части
- `docs/FRONTEND_ROADMAP.md`: план поставки frontend-части
- `docs/TRACKER_WORKFLOW.md`: декомпозиция задач и workflow в трекере
- `docs/BOARD.md`: локальный снимок доски проекта
