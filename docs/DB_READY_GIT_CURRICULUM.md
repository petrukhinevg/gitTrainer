# DB-ready каталог Git-сценариев

## Цель

- Разложить базовый Git curriculum на authored scenarios, которые можно хранить в Postgres.
- Каждая запись должна быть проходимой end-to-end, детерминированной и автоматически проверяемой.
- Сценарий не должен зависеть от внешнего GitHub, ручного review или нестабильной сети.

## Каноническая запись сценария

Для каждой authored scenario нужны как минимум:

- `scenarioSlug`
- учебная цель
- стартовый repo fixture
- answer type
- validator type
- validator config
- success conditions
- failure conditions
- retry feedback profile
- telemetry expectations

## Validator buckets

- `exact_command_match`
  - Для чистых reading/preflight сценариев.
- `git_command_probe`
  - Для реальной команды с проверкой stdout/exit code.
- `git_repo_state_probe`
  - Для mutating-команды с проверкой финального состояния repo.
- `scripted_cli_check`
  - Для сложных multi-step или history-sensitive кейсов, где declarative probe уже недостаточен.

## Волны наполнения

### Волна 1

- Сценарии на чтение состояния, базовые commits, ветки, `fetch`, простые отмены и stash.
- Один сценарий = один наблюдаемый учебный результат.
- Без interactive flows, которые требуют TTY-диалога или неоднозначной интерпретации.

### Волна 2

- Merge, конфликты, rebase, cherry-pick, reflog recovery.
- Нужны richer repo-state checks и local remote fixtures.

### Волна 3

- Protected branch policy, PR-like flow, CI-like gates и multi-worktree team simulation.
- Только через локальный simulator mode, без внешних SaaS зависимостей.

## 1. Введение в Git

- Scenario family:
  - `git init`, создание `README.md`, первый commit, сравнение working tree / index / repository.
  - `git status`, `git diff`, `git diff --staged` после последовательных изменений.
- Fixture:
  - пустой каталог или freshly initialized repo.
- Validator:
  - `git_repo_state_probe` для `init` и первого commit.
  - `git_command_probe` или `exact_command_match` для diff/status preview.
- Success signals:
  - `.git` создан, `HEAD` указывает на ожидаемую ветку, commit существует, staged и unstaged состояния различимы.
- Волна:
  - `Wave 1`.

## 2. Базовый цикл работы

- Scenario family:
  - `status -> add -> commit -> log`.
  - частичная индексация через `git add -p`.
- Fixture:
  - repo с одним изменяемым файлом и детерминированным диффом по хункам.
- Validator:
  - `git_repo_state_probe` для обычного commit flow.
  - `scripted_cli_check` для `git add -p`, если останемся на реальном patch selection.
- Success signals:
  - ожидаемый состав индекса, сообщение commit и форма `git log`.
- Волна:
  - базовый flow в `Wave 1`, partial staging в `Wave 2`.

## 3. Работа с файлами

- Scenario family:
  - добавление, изменение и удаление файлов, `git rm`, `.gitignore`, staged vs unstaged diff.
- Fixture:
  - repo с несколькими файлами и заранее заданными ignored patterns.
- Validator:
  - `git_repo_state_probe`.
- Success signals:
  - корректный index state, ignored files не попали в commit, удаление отражено через tree/index, staged и unstaged версии различимы.
- Волна:
  - `Wave 1`.

## 4. Просмотр изменений

- Scenario family:
  - `git diff`, `git diff --staged`, `git show <hash>`, `git log --follow`.
- Fixture:
  - repo с одним файлом, несколькими commit-ами и как минимум одним rename.
- Validator:
  - `git_command_probe` для preview-команд.
  - `scripted_cli_check` для `log --follow`, если понадобятся более устойчивые проверки вывода.
- Success signals:
  - команда не меняет repo и показывает нужный history/view slice.
- Волна:
  - `Wave 1`, `log --follow` можно держать в `Wave 2`.

## 5. Ветки

- Scenario family:
  - создание ветки, переключение, возврат на `main`, rename branch, delete branch.
- Fixture:
  - repo с базовой веткой и безопасным моментом для branch operations.
- Validator:
  - `git_repo_state_probe`.
- Success signals:
  - активная ветка, список refs, отсутствие лишних side effects, ожидаемая история после branch rename/delete.
- Волна:
  - `Wave 1`.

## 6. Слияние веток

- Scenario family:
  - fast-forward merge.
  - merge commit.
  - merge при изменениях в одной и в обеих ветках.
- Fixture:
  - repo с предсобранным divergence graph.
- Validator:
  - `git_repo_state_probe` для простых кейсов.
  - `scripted_cli_check` для точной валидации родителей merge commit и graph shape.
- Success signals:
  - ожидаемый commit graph, tree content и наличие/отсутствие merge commit.
- Волна:
  - `Wave 2`.

## 7. Конфликты

- Scenario family:
  - конфликт по одной строке, ручное разрешение, обратное слияние.
- Fixture:
  - две ветки с конфликтом в одном и том же файле.
- Validator:
  - `scripted_cli_check`.
- Success signals:
  - конфликт действительно возник, файл разрешён ожидаемым образом, финальный commit и tree корректны.
- Волна:
  - `Wave 2`.

## 8. Отмена изменений

- Scenario family:
  - `git restore`, `git reset` для unstaging, `git revert`, `git commit --amend`.
- Fixture:
  - repo с локальными изменениями и короткой историей.
- Validator:
  - `git_repo_state_probe`.
  - для already-published cases нужен local remote fixture.
- Success signals:
  - рабочее дерево/индекс восстановлены ожидаемо, revert создаёт новый commit, amend меняет только последний commit.
- Волна:
  - локальные кейсы в `Wave 1`, remote-sensitive кейсы в `Wave 2`.

## 9. Rebase и чистая история

- Scenario family:
  - rebase feature на обновлённый `main`.
  - interactive rebase со `squash`/`fixup`.
  - сравнение merge vs rebase.
- Fixture:
  - repo с divergence и несколькими commit-ами для cleanup.
- Validator:
  - `scripted_cli_check`.
- Success signals:
  - ожидаемая линейная история, отсутствие лишних merge commits, корректное содержимое ветки после rebase.
- Волна:
  - `Wave 2`.

## 10. Работа с удалённым репозиторием

- Scenario family:
  - `git clone`, `git remote add`, `git push`, `git fetch`, `git branch -r`, upstream setup.
- Fixture:
  - локальный bare remote и одна или две рабочие копии.
- Validator:
  - `git_command_probe` для preview-команд.
  - `git_repo_state_probe` для `push/fetch/upstream`.
- Success signals:
  - remote-tracking refs, upstream mapping, локальная история и remote refs согласованы.
- Волна:
  - `Wave 1` для `fetch/branch -r`, `Wave 2` для полного clone/push/upstream набора.

## 11. Синхронизация с основной веткой

- Scenario family:
  - обновление feature-ветки через merge и через rebase.
  - `git pull --rebase`.
- Fixture:
  - локальный remote и divergence между `main` и feature branch.
- Validator:
  - `git_repo_state_probe` для простых кейсов.
  - `scripted_cli_check` для точной формы истории.
- Success signals:
  - ожидаемый graph outcome и корректное расположение локальных commit-ов.
- Волна:
  - `Wave 2`.

## 12. Временное сохранение работы

- Scenario family:
  - `git stash`, `git stash pop`, `git stash --patch`.
- Fixture:
  - repo с staged и unstaged изменениями.
- Validator:
  - `git_repo_state_probe`.
  - `scripted_cli_check` для patch-stash.
- Success signals:
  - stash stack содержит ожидаемую запись, изменения корректно скрыты и восстановлены.
- Волна:
  - базовый stash в `Wave 1`, patch stash в `Wave 2`.

## 13. Перенос отдельных изменений

- Scenario family:
  - один `git cherry-pick`.
  - диапазон последовательных cherry-pick commit-ов.
- Fixture:
  - две ветки и source commit range.
- Validator:
  - `git_repo_state_probe` для простого кейса.
  - `scripted_cli_check` для multi-commit и conflict variants.
- Success signals:
  - целевая ветка получила ожидаемые изменения и историю без лишних side effects.
- Волна:
  - простой кейс в `Wave 2`, диапазоны и конфликты позже.

## 14. Восстановление после ошибок

- Scenario family:
  - `git reflog`, восстановление после `reset`, `git rebase --abort`.
- Fixture:
  - repo с потерянным reachable commit и подготовленным failed rebase state.
- Validator:
  - `scripted_cli_check`.
- Success signals:
  - потерянный commit снова достижим, aborted rebase вернул ожидаемое состояние ветки.
- Волна:
  - `Wave 2`.

## 15. Практика командной разработки

- Scenario family:
  - feature branch flow.
  - PR-like merge gate.
  - protected main.
  - two-developer sync flow.
  - CI-like check gate.
- Fixture:
  - локальный bare remote, несколько рабочих копий и simulator rules.
- Validator:
  - `scripted_cli_check` или отдельный simulator runner.
- Success signals:
  - branch policy и integration path подтверждаются локальными правилами, без обращения к внешнему GitHub.
- Волна:
  - `Wave 3`.

## Первая DB-backed волна

Рекомендуемый первый import в Postgres:

- 1. Введение в Git: `init`, `status`, `diff`.
- 2. Базовый цикл: `add`, `commit`, `log`.
- 3. Работа с файлами: add/modify/remove/gitignore.
- 5. Ветки: create/switch/rename/delete.
- 8. Отмена изменений: `restore`, `reset`, `revert`.
- 10. Работа с remote: `fetch`, `branch -r`, upstream basics.
- 12. Временное сохранение: `stash`, `stash pop`.

## Что не пускать в первую волну

- Любые сценарии, которые требуют живого GitHub, network race или ручной оценки.
- Interactive TTY flows без детерминированного automation hook.
- Сценарии, где один шаг одновременно проверяет несколько независимых учебных результатов.

## Связь с authored schema

- `authored_scenarios` хранит learner-facing task и repository context.
- `authored_scenario_validator_specs` хранит validator type, timeout и config.
- `authored_scenario_validator_rules` хранит допустимые команды и outcome mapping.
- `validation_runs` фиксирует фактическое исполнение validator-а и его outcome.
