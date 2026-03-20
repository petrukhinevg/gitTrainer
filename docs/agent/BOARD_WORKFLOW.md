# Issue и project board workflow

## Когда читать

- issue, labels, parent/sub-issue, statuses, board handoff

## Правила

- Заголовки и описания issue - на русском.
- Parent issue: `[эпик] <текст>`.
- Child issue: без `[эпик]`.
- Сразу ставь корректные labels, если scope уже понятен.
- Child issues добавляй только в active parent issues.
- Если parent issue уже `Done`, создавай новый parent issue.

## Status

- sufficiently defined -> `Ready`
- active work -> `In Progress`
- implemented -> `Review`
- accepted -> `Done`

## Board specifics

- Конфигурация полей и колонок: `docs/BOARD.md`.
- `Linked pull requests` обязательно только для epic issues с PR в `main`.
- Для child issues отсутствие `Linked pull requests` не блокирует `Review`.
- Если epic PR уже есть, а linkage пуст, исправь его до завершения handoff.

## Setup

1. Создай parent и child issues.
2. Назначь labels.
3. Привяжи child к parent.
4. Добавь issues на доску.
5. Выставь начальный `Status`.
