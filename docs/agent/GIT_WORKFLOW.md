# Git и PR workflow

## Когда читать

- ветки, коммиты, push, PR, review handoff

## Имена веток

- Формат: `номерКарточки_КороткоОписание`.

## Ветки

- `main` - production.
- Epic и standalone task branches создаются от `main`.
- После создания epic branch сделай initial epic commit до любых child branches.
- Child branches создавай от текущей головы epic branch, а не от `main` и не от другой child branch.
- После разрешённого merge в epic branch следующие child branches создавай от обновлённой epic branch.
- Не вливай child в epic и epic в `main` заранее только ради разблокировки разработки.
- Если задача зависит от невлитой sibling work, считай её blocked и продолжай с независимыми задачами.
- Исключение: merge child в epic допустим, если без интеграции дальше нельзя.
- Если задача делится по ходу работы, новые child branches создавай от текущей головы epic branch.

## Коммиты

- Основной implementation commit: `number_ShortCommitDescription`.
- Обычно одна task branch = один основной implementation commit.
- Review fixes остаются в той же ветке, при необходимости отдельным commit `review fix`.
- Не смешивай несвязанные изменения.
- Перед каждым коммитом запускай `./gradlew checkstyleMain`.

## Push и PR

- Не push во время активной реализации без прямой просьбы пользователя.
- При переводе в `Review` ветка должна быть опубликована, если handoff это требует.
- У epic branch должен быть PR в `main`.
- Для child tasks отдельный PR опционален.
- Epic flow: branch -> initial commit -> optional push -> epic PR -> child branches.
- `Closes`/`Fixes`/`Resolves` используй только для PR в `main`.
- Если нужен reference без автозакрытия, используй `Refs`.
- Если closed PR нельзя reopen для той же `head/base`, открывай новый PR из alias branch.

## После завершения задачи, перед merge

- Во время активной реализации не требуется часто запускать тесты; используй их только если это нужно для отладки или локальной проверки гипотезы.
- Финальные проверки запускай после завершения работы над задачей и перед merge.
- `./gradlew checkstyleMain`
- `./gradlew check`
- если менялся backend: при необходимости отдельно `./gradlew test`
- если менялся frontend: production build в `frontend/`
