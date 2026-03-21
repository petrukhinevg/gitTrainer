# GitHub automation и CLI

- Переиспользуемые `gh` и GraphQL-команды.
- Правила процесса смотри в `docs/agent/GIT_WORKFLOW.md` и `docs/agent/BOARD_WORKFLOW.md`.

## Linked branch

```sh
gh issue develop --list 324 --repo petrukhinevg/gitTrainer
```

- Если ветки ещё нет, команда может её создать.
- Если удалённая ветка уже существует, для надёжной linkage обычно лучше новое имя.

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

Параметры:

- `issueId`: GraphQL ID issue из `gh issue view <number> --json id`
- `repoId`: GraphQL ID репозитория из `gh repo view <owner>/<repo> --json id`
- `oid`: SHA коммита
- `name`: новое имя удалённой ветки

## Add sub-issue

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

Параметры:

- `issueId`: GraphQL ID parent issue
- `subIssueId`: GraphQL ID child issue

Получить GraphQL ID issue:

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

## Pull request

- PR создаём для любой task branch.
- Для epic PR в `main` используй связку с issue (`Closes #...`).
- Для child task PR linkage с issue не обязателен, если workflow не требует иного.

```sh
gh pr create \
  --base main \
  --head 324_InstructionRefactor \
  --title "[эпик] Рефакторинг инструкций репозитория" \
  --body "Closes #324"
```

## Update board status

Сначала получи id поля `Status` и id его опций:

```sh
gh project field-list 4 --owner petrukhinevg --format json
```

Если `gh project item-list` не даёт id карточки, запроси его из issue:

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

Затем обнови статус:

```sh
gh project item-edit \
  --id <project-item-id> \
  --project-id <project-id> \
  --field-id <status-field-id> \
  --single-select-option-id <status-option-id>
```
