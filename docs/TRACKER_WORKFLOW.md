# Процесс работы с трекером

## Базовый процесс

1. Пользователь создаёт задачу в трекере.
2. Для epic исполнитель создаёт epic branch, делает initial epic commit в этой ветке и только после этого создаёт child task branches от текущей головы epic branch.
3. Исполнитель берёт задачу в работу в её выделенной ветке.
4. Ветку задачи также нужно зарегистрировать как linked branch для issue, чтобы GitHub мог связать будущие PR с `Linked pull requests`.
5. После реализации исполнитель пушит ветку, создаёт или обновляет PR, привязывает PR в `Linked pull requests`, а затем переводит задачу в `Review`.
6. Если review находит проблемы, исправляй их в той же ветке follow-up коммитом с пометкой review fix.
7. Если review обнаруживает, что задача смешивает product discovery и implementation, раздели scope и сначала обнови roadmap.
8. Каждая задача должна описывать завершённый и пригодный для review результат.

## Колонки доски

- `Backlog`: всё зафиксировано, но ещё не готово
- `Ready`: задача достаточно определена и готова к реализации
- `In Progress`: активная разработка
- `Review`: реализовано и ожидает ревью
- `Done`: принято и завершено

Держи фактическое состояние доски в `docs/BOARD.md` или в удалённой project board.

Используй project field `Pairs with`, когда backend-задача и frontend-задача представляют один и тот же пользовательский slice, но остаются независимо реализуемыми.

## Правила декомпозиции

- Задача должна давать понятный и тестируемый результат.
- Задача должна быть достаточно маленькой, чтобы её можно было реализовать, протестировать и отревьюить без чрезмерного контекста.
- Если фича требует крупных изменений сразу в нескольких областях, это хороший кандидат на `parent issue`.
- Если результат нельзя описать одним коротким outcome statement, задачу нужно делить.
- Не переусложняй декомпозицию в начале epic, если стабильные seams ещё не ясны.
- Позже допустимо дробить child task внутри epic, когда контракт, форма данных или UI loop стали яснее, и это улучшает параллельность или reviewability.
- Не дроби работу ниже уровня полезного PR; если у sub-issue нет самостоятельной ценности для ревью, она слишком мала.
- Для этого продукта разделяй content modeling, validation logic и SPA UX work, если только очень маленькое изменение естественно не охватывает всё сразу.
- Не держи sibling tasks в одном parent issue, если одной из них потребуется код из другой незавершённой sibling task. В таком случае объединяй их или меняй структуру parent issue.
- Backend и frontend задачи могут быть связаны по одному пользовательскому slice, но pairing предпочтителен, а не обязателен.
- Backend-only и frontend-only child tasks допустимы, если они всё равно дают завершённый результат от epic baseline.

## Что считать задачей

Подходящая задача:

- одна пользовательская capability, например запуск сценария или просмотр прогресса;
- одна техническая подфича, нужная для разблокировки следующей capability, например validation payloads или persistence сессий;
- один инфраструктурный или платформенный шаг, открывающий дальнейшую работу;
- один шаг по контенту или конфигурации, открывающий следующий инкремент, например seed начального каталога Git-упражнений.

Неподходящая задача:

- «собрать весь frontend»;
- «реализовать весь Git engine»;
- «добавить все учебные сценарии»;
- любая work item, которая естественно распадается на несколько независимых результатов.

## Что считать parent issue

Создавай `parent issue`, когда:

- фича содержит несколько независимых пользовательских flow;
- результат нельзя поставить одним компактным изменением;
- завершение требует последовательности задач, которые должны проходить review отдельно.

При декомпозиции parent issue:

- начинай с минимального набора child tasks, у которых уже есть ясные независимые результаты
- добавляй более мелкие child tasks позже только там, где это улучшает параллельную работу или уменьшает блокировки
- строй набор child tasks вокруг независимо реализуемых результатов, а не вокруг слоёв framework

## Git-процесс

- `main` — production branch.
- По умолчанию используй только текущую локальную директорию репозитория.
- Не создавай и не используй отдельную локальную папку, соседний клон репозитория или `git worktree` для выполнения задачи, если пользователь явно этого не запросил.
- Если существует несколько локальных копий репозитория, игнорируй их и продолжай работу в текущем репозитории, если пользователь явно не перенаправил тебя.
- Epic branches и standalone task branches создаются от `main`.
- После создания epic branch сделай initial epic commit в ней до создания child task branches.
- После появления initial epic commit сразу создай child task branches для всех текущих sub-issues.
- Child task branches внутри epic создаются от текущей головы epic branch, а не от `main`.
- Child task branch должна создаваться от текущей головы epic branch, а не от другой child task branch.
- Если epic branch уже впитала проверенную работу во время допустимой merge-фазы, более поздние child branches всё равно создаются от обновлённой epic branch, а не от кончика слитой child branch.
- Не мержи child work в epic branch и не мержи epic branch в `main` раньше времени только ради разблокировки последующей разработки.
- Если child task зависит от незавершённой или ещё не слитой child work, считай такую задачу заблокированной, сохраняй exploratory work вне канонических имён `task/*` и продолжай только с независимыми child tasks.
- Исключение: merge child task branch в epic branch допустим, если дальнейшая разработка действительно невозможна без уже интегрированного результата.
- У каждой epic branch должен быть свой PR в `main`, привязанный к epic issue.
- Child task branches реализуются отдельно и не должны мержиться в epic branch до завершения review и статуса `Done`.
- У каждой task branch должен быть один основной implementation commit, если только не понадобились review fixes.
- Основной implementation commit должен называться как `number_ShortCommitDescription`, где `number` — номер задачи.
- Относись к child task branches как к изолированному WIP, пока другие child tasks могут независимо развиваться от epic baseline.
- Если реализация более поздней child task потребует merge более ранней child branch в epic branch до естественной готовности epic, пропусти эту задачу и продолжай с другими незаблокированными child tasks.
- Merge проверенных child branches в epic branch делай только тогда, когда оставшиеся незавершённые задачи действительно заблокированы без этих результатов и независимой child work больше не осталось.
- Когда child task или standalone task переводится в `Review`, запушь ветку до изменения board status.
- После push каждая task branch должна иметь собственный PR против epic branch.
- Перед переводом задачи в `Review` проверь, что PR привязан и виден в поле `Linked pull requests`.
- Если платформа требует ручной linkage для PR не в default branch, сделай её вручную до перевода в `Review`.
- Если child task делится во время реализации, создавай новые child branches от текущей головы epic branch, а не от in-progress sibling branch.

## Быстрая настройка доски

Используй эту последовательность, чтобы потом не пришлось вручную чистить состояние:

1. Создай parent issue и все child issues.
2. Сразу привяжи каждую child issue к своему parent issue.
3. Создай epic branch от `main`.
4. Сделай initial epic commit в epic branch.
5. Запушь epic branch в `origin`.
6. Создай epic PR в `main`.
7. Создай каждую child task branch от текущей головы epic branch.
8. Зарегистрируй каждую child branch как linked branch для её issue до начала реализации.
9. Добавь все issues на доску и выставь им начальный `Status`.

## Настройка linked branches и PR

Используй эту последовательность для каждой child task, чтобы `Linked pull requests` заполнялось предсказуемо:

1. Убедись, что epic branch уже существует на `origin`.
2. Создай локальную task branch от текущей головы epic branch.
3. Запушь task branch в `origin`.
4. Зарегистрируй task branch как linked branch для issue.
5. Реализуй задачу и создай task PR с epic branch как `base`.
6. Проверь, что issue показывает этот PR в `Linked pull requests` до перевода задачи в `Review`.

Если ветка была создана локально до настройки GitHub issue linkage, не предполагай, что поле заполнят задним числом автоматически. В таком случае:

- проверь, что task branch существует на `origin`
- проверь, что PR нацелен в epic branch
- вручную убедись, что PR ассоциирован с issue
- если GitHub всё равно не заполняет `Linked pull requests`, исправь linkage до того, как полагаться на состояние доски

## Заметки по GitHub automation

Используй эти заметки, когда workflow трекера выполняется через `gh` или GraphQL вместо браузера.

Если задача раскрывает стабильную последовательность команд, API query, mutation или workaround, которые, вероятно, ещё пригодятся, добавляй эту заметку сюда сразу, пока детали свежие, а не оставляй её только в истории чата.

### Один локальный checkout

Базовый workflow использует один локальный checkout репозитория.

Операционное правило:

- переключай ветки внутри одной локальной директории вместо создания отдельных task-папок
- перед переключением задач или веток держи worktree чистым: коммить текущую логическую единицу или явно согласовывай оставшиеся локальные изменения
- используй альтернативные локальные директории или `git worktree` только если пользователь явно попросил такую схему

### Связанные ветки

Чтобы посмотреть linked branches для issue:

```sh
gh issue develop --list 137 --repo petrukhinevg/gitTrainer
```

Если целевая ветка ещё не существует, `gh issue develop` может создать и зарегистрировать её.

Если удалённая ветка уже существует, GitHub может отказаться заполнять linkage задним числом. В таком случае сначала создай новое linked branch name и открывай PR уже из него, а не рассчитывай, что существующее имя ветки начнёт считаться linked post factum.

GraphQL mutation, которая сработала для создания linked branch на новом имени:

```graphql
mutation($issueId: ID!, $repoId: ID!, $oid: GitObjectID!, $name: String!) {
  createLinkedBranch(
    input: {issueId: $issueId, repositoryId: $repoId, oid: $oid, name: $name}
  ) {
    linkedBranch {
      ref {
        name
      }
    }
  }
}
```

Нужные параметры:

- `issueId`: GraphQL ID issue из `gh issue view <number> --json id`
- `repoId`: GraphQL ID репозитория из `gh repo view <owner>/<repo> --json id`
- `oid`: commit SHA, на который должна указывать linked branch
- `name`: новое имя удалённой ветки, например `linked/137-catalog-browse-api-shell-stub-boundary`

Наблюдаемое поведение:

- создание linked branch на новом remote-имени сработало
- попытка зарегистрировать уже существующее имя удалённой ветки не дала надёжного backfill

### Pull requests для epic branches

Для child task PR, у которых epic branch является `base`, используй `Refs #<issue>` в теле PR, чтобы сохранить ассоциацию с issue и не полагаться на closing behavior default branch.

Пример:

```sh
gh pr create \
  --base epic/98-scenario-catalog-browsing-mvp \
  --head linked/137-catalog-browse-api-shell-stub-boundary \
  --title "#137 Deliver catalog browse API shell and deterministic stub boundary" \
  --body "Refs #137"
```

Если уже существует закрытый PR с теми же `head` и `base`, и GitHub отказывается его переоткрыть, создай новую alias branch на том же коммите и открой свежий PR уже из alias branch вместо переписывания истории.

### Поле `Linked pull requests`

Даже если linked branch и соответствующий PR уже существуют, project field `Linked pull requests` может обновляться с задержкой или всё ещё требовать ручной issue association для PR не в default branch.

Операционное правило:

- не переводи задачу в `Review`, пока PR реально не появился в поле `Linked pull requests`
- если поле всё ещё пустое, оставляй задачу в `In Progress`, даже если код и тесты уже готовы
- если автоматический linkage не заполнил поле, завершай ручную ассоциацию в GitHub UI в рамках той же передачи задачи, а не откладывай это на потом

Наблюдаемое ограничение:

- даже после создания свежей linked branch через `gh issue develop`, push коммита в эту linked branch и открытия PR с `Refs #<issue>` против epic branch поле проекта может оставаться пустым
- в таком состоянии GitHub уже может показывать cross-reference из таймлайна issue в PR, но этого всё равно недостаточно, чтобы считать `Linked pull requests` выполненным
- если это происходит, оставляй задачу в `In Progress` и заверши оставшийся linkage через GitHub UI до перевода в `Review`

### Обновление project status

Если нужно обновить статус в project board через CLI, сначала посмотри project fields, чтобы получить id текущего поля `Status` и id его опций:

```sh
gh project field-list 4 --owner petrukhinevg
```

Если вывода `gh project item-list` недостаточно, чтобы определить id карточки задачи, запроси его прямо у issue:

```sh
gh api graphql -f query='query {
  repository(owner: "petrukhinevg", name: "gitTrainer") {
    issue(number: 199) {
      projectItems(first: 10) {
        nodes {
          id
        }
      }
    }
  }
}'
```

После этого обнови значение single-select статуса так:

```sh
gh project item-edit \
  --id <project-item-id> \
  --project-id <project-id> \
  --field-id <status-field-id> \
  --single-select-option-id <status-option-id>
```

### Последующие дочерние задачи после seam work

Если более поздняя child task зависит от seam, которая была доставлена в более ранней child branch, а не в initial epic baseline, не начинай следующую задачу от старой головы epic.

Вместо этого:

1. проведи review блокирующей child task
2. смержи эту проверенную child branch в epic branch
3. создай следующую child branch от обновлённой головы epic
