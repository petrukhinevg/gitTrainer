# GitHub automation и CLI

Этот документ хранит переиспользуемые команды для `gh` и GraphQL. Правила процесса смотри в `docs/agent/GIT_WORKFLOW.md` и `docs/agent/BOARD_WORKFLOW.md`.

## Связанные ветки и PR-linkage

Чтобы посмотреть связанные ветки для issue:

```sh
gh issue develop --list 324 --repo petrukhinevg/gitTrainer
```

Если целевой ветки ещё нет, `gh issue develop` может создать и зарегистрировать её.

Если удалённая ветка уже существует, GitHub может отказаться заполнять привязку задним числом. В таком случае создай новое имя linked branch и уже из него открывай PR.

GraphQL mutation, которая сработала для создания linked branch с новым именем:

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

Обязательные входные параметры:

- `issueId`: GraphQL ID issue из `gh issue view <number> --json id`
- `repoId`: GraphQL ID репозитория из `gh repo view <owner>/<repo> --json id`
- `oid`: SHA коммита, на который должна указывать linked branch
- `name`: новое имя удалённой ветки, например `324_InstructionRefactor`

Практическое наблюдение: новое имя linked branch работает надёжнее, чем попытка привязать уже существующее.

## Подзадачи parent issue

Если нужно привязать уже созданную issue как sub-issue к parent issue из CLI, используй GraphQL mutation `addSubIssue`:

```graphql
mutation($issueId: ID!, $subIssueId: ID!) {
  addSubIssue(input: {issueId: $issueId, subIssueId: $subIssueId}) {
    issue {
      number
    }
    subIssue {
      number
    }
  }
}
```

Обязательные входные параметры:

- `issueId`: GraphQL ID parent issue
- `subIssueId`: GraphQL ID дочерней issue

Получить GraphQL ID issue можно через:

```sh
gh issue view <number> --json id
```

Пример:

```sh
gh api graphql \
  -f query='mutation($issueId: ID!, $subIssueId: ID!) {
    addSubIssue(input: {issueId: $issueId, subIssueId: $subIssueId}) {
      issue { number }
      subIssue { number }
    }
  }' \
  -F issueId='<parent-issue-id>' \
  -F subIssueId='<child-issue-id>'
```

## Pull requests

Пример epic PR в `main`:

```sh
gh pr create \
  --base main \
  --head 324_InstructionRefactor \
  --title "[эпик] Рефакторинг инструкций репозитория" \
  --body "Closes #324"
```

## Обновление статуса проекта

Когда нужно обновить статус на доске из CLI, сначала посмотри поля проекта, чтобы получить id поля `Status` и id его опций:

```sh
gh project field-list 4 --owner petrukhinevg --format json
```

Если `gh project item-list` не даёт id карточки, запроси его напрямую из issue:

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

Затем обнови single-select значение статуса так:

```sh
gh project item-edit \
  --id <project-item-id> \
  --project-id <project-id> \
  --field-id <status-field-id> \
  --single-select-option-id <status-option-id>
```
