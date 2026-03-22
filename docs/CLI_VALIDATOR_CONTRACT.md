# Контракт CLI git validator

## Назначение

- Backend остаётся source of truth для authored scenarios, validator specs, retry feedback и telemetry.
- CLI validator исполняет git-oriented проверку в изолированном процессе и возвращает нормализованный JSON-результат.
- DB хранит validator spec, а CLI не содержит захардкоженного сценарного каталога.

## Границы MVP

- Поддерживаются ответы типа `command_text`.
- CLI вызывается процессным адаптером из backend.
- Session/submission lifecycle и запись validation runs остаются в backend.
- Текущий MVP не требует, чтобы `sessionId` и `submissionId` передавались в CLI request: они уже сохраняются в backend telemetry и могут быть добавлены позже как backward-compatible расширение.

## Источник правды

- `authored_scenario_validator_specs` хранит тип валидатора, timeout и `config_payload`.
- `authored_scenario_validator_rules` хранит допустимые match rules и outcome-мэппинг.
- CLI получает уже собранный `ScenarioValidationSpec` и не читает Postgres напрямую.

## Request JSON

Текущий request, который backend пишет во временный JSON-файл:

```json
{
  "scenarioSlug": "remote-sync-preview",
  "answer": {
    "type": "command_text",
    "value": "git fetch origin"
  },
  "spec": {
    "specId": "default:remote-sync-preview:command_text",
    "scenarioSlug": "remote-sync-preview",
    "answerType": "command_text",
    "validatorType": "git_repo_state_probe",
    "timeoutMs": 5000,
    "config": {
      "expectedExitCode": 0
    },
    "rules": [
      {
        "matchType": "exact_normalized_command",
        "rawMatchValue": "git fetch origin",
        "normalizedAnswerValue": "git fetch origin",
        "correctness": "correct",
        "code": "expected-command",
        "message": "Отправленная команда совпадает с ожидаемым безопасным следующим шагом для этого сценария."
      }
    ]
  }
}
```

## Response JSON

CLI обязан вернуть JSON в stdout.

```json
{
  "status": "evaluated",
  "correctness": "correct",
  "code": "expected-command",
  "message": "Отправленная команда совпадает с ожидаемым безопасным следующим шагом для этого сценария.",
  "observations": [
    {
      "code": "normalized-answer",
      "message": "git fetch origin"
    }
  ],
  "artifacts": [],
  "timing": {
    "durationMs": 12
  }
}
```

## Response поля

- `status`: сейчас поддерживается только `evaluated`.
- `correctness`: `correct`, `incorrect` или `unsupported`.
- `code`: machine-readable outcome code.
- `message`: learner-facing или operator-facing пояснение.
- `observations`: диагностические наблюдения для telemetry и future debugging.
- `artifacts`: список путей или logical artifact ids; в текущем MVP обычно пустой.
- `timing.durationMs`: длительность обработки внутри CLI процесса.

## Supported validator types

- `exact_command_match`
  - In-process и CLI path делают одинаковый normalized rule match.
- `git_command_probe`
  - CLI поднимает временный repo fixture, запускает реальную git-команду и проверяет `exitCode`/`stdout`.
- `git_repo_state_probe`
  - CLI поднимает временный repo fixture с remote topology, запускает реальную git-команду и проверяет post-command repo state.

## Supported rule types

- `exact_normalized_command`
  - Пользовательская команда нормализуется и сравнивается с rule из spec.

## Ошибки runner слоя

Если CLI процесс не стартовал, вышел по timeout или вернул невалидный ответ, backend поднимает `ValidationRunnerExecutionException` и сохраняет `validation_run` со статусом `runner-failed`.

Типовые error codes:

- `validation-runner-timeout`
- `validation-runner-failed`
- `validation-runner-empty-response`
- `validation-runner-invalid-response`
- `validation-runner-invalid-command`
- `validation-runner-invalid-config`
- `validation-runner-workspace-setup-failed`
- `validation-runner-git-not-found`

## Совместимость

- Новые поля в request/response должны добавляться как backward-compatible расширения.
- Новые validator types допустимы, если старые spec records и старый backend path продолжают работать без миграции authored data.
- In-process validator обязан деградировать до rule-based поведения, если полноценная git-проверка выполняется только в CLI runner.

## Execution policy

- По умолчанию внешний executable запрещён.
- CLI работает в разрешённой рабочей директории и не наследует окружение, если это явно не разрешено policy.
- stdout/stderr ограничиваются по размеру и читаются из временных файлов.
- Timeout берётся как минимум из process policy и validator spec.

## Связанные файлы

- `src/main/java/com/example/gittrainer/validation/cli/CliValidationRequest.java`
- `src/main/java/com/example/gittrainer/validation/cli/CliValidationResponse.java`
- `src/main/java/com/example/gittrainer/validation/infrastructure/CliSubmissionAnswerValidator.java`
- `src/main/java/com/example/gittrainer/validation/application/ScenarioValidationSpec.java`
- `src/main/resources/db/migration/V5__validator_specs.sql`
- `src/main/resources/db/migration/V6__validation_runs.sql`
- `src/main/resources/db/migration/V7__git_command_probe_branch_safety.sql`
- `src/main/resources/db/migration/V8__git_repo_state_probe_remote_sync_preview.sql`
