# Инструкции для агента репозитория

Этот файл содержит только repo-wide правила и карту документов. В каждом новом чате начинай с `LOCAL_AGENT_START.md`: он даёт быстрый bootstrap и подсказывает, какие документы действительно нужны для текущей задачи.

## Старт нового чата

0. Всегда отвечай и работай только на русском языке.
1. Прочитай `LOCAL_AGENT_START.md`.
2. Следуй маршрутизации из `LOCAL_AGENT_START.md` и открывай только нужные документы.
3. Возвращайся в этот файл, когда нужны общие ограничения репозитория, локальные доступы или список профильных инструкций.

## Карта инструкций

- `docs/TRACKER_WORKFLOW.md`: рабочий workflow, декомпозиция задач, шаблоны issue и гигиена смены scope.
- `docs/agent/GIT_WORKFLOW.md`: ветки, коммиты, push, PR, review-fix и проверки перед push.
- `docs/agent/BOARD_WORKFLOW.md`: labels, parent/sub-issue, статусы задач и работа с project board.
- `docs/agent/GITHUB_AUTOMATION.md`: `gh`, GraphQL, linked branches и CLI-примеры для GitHub metadata flow.
- `docs/ROADMAP.md`: product-level parent issues.
- `docs/BACKEND_ROADMAP.md`: backend-only очередь.
- `docs/FRONTEND_ROADMAP.md`: frontend-only очередь.
- `docs/ARCHITECTURE.md`: границы backend/frontend и правила размещения пакетов.

## Локальные файлы и доступы

- Не коммить `LOCAL_AGENT_START.md` и `.env`.
- Используй `GIT_USERNAME` и `GIT_TOKEN` для git-действий и операций с удалённой платформой, если нужны аутентифицированные действия.
- Для `gh` используй `GH_TOKEN`; если токен загружается из `.env`, предпочитай `set -a && source .env && set +a`, чтобы переменные точно экспортировались в окружение команды.
- Админские доступы используй только для owner-level операций над репозиторием.
- Не полагайся на парольную аутентификацию, если этого явно не требуют.
- Проверяй `.env` только тогда, когда задаче действительно нужны локальные доступы или токены.

## Поддержка инструкций

- Если в ходе задачи обнаружились стабильные `gh`-команды, API-запросы, GraphQL mutation или другие повторяемые операционные заметки, добавь их в [docs/agent/GITHUB_AUTOMATION.md](/Users/petrukhinevg/IdeaProjects/gitTrainer/docs/agent/GITHUB_AUTOMATION.md).
- Если меняется реальный рабочий процесс по задачам, обновляй [docs/TRACKER_WORKFLOW.md](/Users/petrukhinevg/IdeaProjects/gitTrainer/docs/TRACKER_WORKFLOW.md), а не дублируй правило в нескольких местах.
- Если меняются правила ветвления, review handoff или проверок перед push, обновляй [docs/agent/GIT_WORKFLOW.md](/Users/petrukhinevg/IdeaProjects/gitTrainer/docs/agent/GIT_WORKFLOW.md).
- Если меняется конфигурация project board или правила статусов, обновляй [docs/agent/BOARD_WORKFLOW.md](/Users/petrukhinevg/IdeaProjects/gitTrainer/docs/agent/BOARD_WORKFLOW.md) и при необходимости [docs/BOARD.md](/Users/petrukhinevg/IdeaProjects/gitTrainer/docs/BOARD.md).

## Правила ревью

- В code review в первую очередь ищи баги, риски поведения, регрессии, нарушения контрактов, архитектурные нарушения относительно `docs/ARCHITECTURE.md` и недостающие проверки.
- Замечания по naming, структуре и читаемости выноси в findings только когда они создают реальный риск сопровождения, маскируют поведение, ломают принятые границы или повышают вероятность ошибки.
- Если naming, локальная структура или архитектурное решение выглядят спорно, но не тянут на конкретный риск или нарушение правил репозитория, не раздувай список findings искусственно.
- После основных findings можно добавлять отдельный краткий блок `Нефункциональные наблюдения` для неблокирующих замечаний по naming, API-форме, локальной композиции, UX-copy или дальнейшему упрощению кода.
- Если таких наблюдений нет, нормально завершать review только списком реальных findings и кратко фиксировать остаточные риски или пробелы в тестах.
