export const FIXTURE_SCENARIO_DETAILS = Object.freeze({
    "status-basics": {
        "id": "status-basics",
        "slug": "status-basics",
        "title": "Проверь изменения перед первым Git-действием",
        "summary": "В `main` уже изменены `README.md` и `src/main.js`, а `notes/status-checklist.md` ещё не отслеживается. Сначала покажи короткий статус, а не меняй репозиторий.",
        "difficulty": "beginner",
        "tags": [
            "status",
            "working-tree",
            "basics"
        ],
        "meta": {
            "source": "local-fixture",
            "stub": false
        },
        "workspace": {
            "shell": {
                "leftPanelTitle": "Карта сценария",
                "centerPanelTitle": "Урок",
                "rightPanelTitle": "Практика"
            },
            "task": {
                "status": "authored-fixture",
                "goal": "Вы на `main`. Перед любым `add`, `checkout` или очисткой нужно коротко проверить, какие файлы уже изменены и какие ещё не отслеживаются.",
                "instructions": [
                    {
                        "id": "inspect-working-tree-first",
                        "text": "Не меняйте репозиторий. Первый ответ должен быть командой чтения статуса."
                    },
                    {
                        "id": "confirm-short-status-signals",
                        "text": "Используйте короткий формат, чтобы сразу увидеть `README.md`, `src/main.js` и новый `notes/status-checklist.md`."
                    },
                    {
                        "id": "avoid-mutation-commands",
                        "text": "Ожидается безопасный следующий шаг из семейства `git status`, без stage, checkout и cleanup."
                    }
                ],
                "steps": [
                    {
                        "position": 1,
                        "title": "Заметьте, что вы уже на `main`",
                        "detail": "Переключать ветки не нужно. Сначала разберитесь с текущим рабочим деревом."
                    },
                    {
                        "position": 2,
                        "title": "Подтвердите изменённые tracked-файлы",
                        "detail": "Команда должна показать, что `README.md` и `src/main.js` уже изменены."
                    },
                    {
                        "position": 3,
                        "title": "Не забудьте про новый файл",
                        "detail": "`notes/status-checklist.md` пока не отслеживается и тоже должен попасть в обзор."
                    },
                    {
                        "position": 4,
                        "title": "Выберите компактный вывод",
                        "detail": "Для этой задачи нужен короткий status, а не длинное описание состояния."
                    },
                    {
                        "position": 5,
                        "title": "Оставьте репозиторий без изменений",
                        "detail": "После ответа рабочее дерево должно остаться в том же состоянии: задача только про проверку."
                    }
                ],
                "annotations": [
                    {
                        "label": "Что нужно увидеть",
                        "message": "В рабочем дереве сейчас два modified-файла и один untracked-файл."
                    },
                    {
                        "label": "Какой шаг ожидается",
                        "message": "Правильный ответ — короткий `git status`, который ничего не меняет в репозитории."
                    }
                ]
            },
            "repositoryContext": {
                "status": "authored-fixture",
                "branches": [
                    {
                        "name": "main",
                        "current": true
                    },
                    {
                        "name": "docs/review-notes",
                        "current": false
                    }
                ],
                "commits": [
                    {
                        "id": "a1c9e31",
                        "summary": "docs: добавить черновик заметок по ревью"
                    },
                    {
                        "id": "f72ab44",
                        "summary": "app: удержать оболочку рабочего пространства стабильной"
                    }
                ],
                "files": [
                    {
                        "path": "README.md",
                        "status": "modified"
                    },
                    {
                        "path": "notes/status-checklist.md",
                        "status": "untracked"
                    },
                    {
                        "path": "src/main.js",
                        "status": "modified"
                    }
                ],
                "annotations": [
                    {
                        "label": "Сигнал рабочего дерева",
                        "message": "`README.md` и `src/main.js` уже изменены, а `notes/status-checklist.md` ещё не добавлен в Git."
                    },
                    {
                        "label": "Почему нельзя спешить",
                        "message": "До проверки статуса любой `git add`, `checkout` или очистка будет действием вслепую."
                    }
                ]
            }
        }
    },
    "branch-safety": {
        "id": "branch-safety",
        "slug": "branch-safety",
        "title": "Подтверди ветку и незавершённый hotfix",
        "summary": "Вы уже на `release/hotfix-7`, а `src/ui/header.css` и `docs/release-checklist.md` изменены. Сначала подтвердите ветку и только потом решайте, можно ли переключаться.",
        "difficulty": "beginner",
        "tags": [
            "branching",
            "navigation",
            "basics"
        ],
        "meta": {
            "source": "local-fixture",
            "stub": false
        },
        "workspace": {
            "shell": {
                "leftPanelTitle": "Карта сценария",
                "centerPanelTitle": "Урок",
                "rightPanelTitle": "Практика"
            },
            "task": {
                "status": "authored-fixture",
                "goal": "Перед любым `checkout` нужно подтвердить, что работа уже открыта в `release/hotfix-7`, и собрать branch-aware status незавершённых правок.",
                "instructions": [
                    {
                        "id": "confirm-active-branch-before-switching",
                        "text": "Сначала покажите, какая ветка активна сейчас. Без этого решение о переключении будет догадкой."
                    },
                    {
                        "id": "connect-open-edits-to-branch-purpose",
                        "text": "Свяжите `release/hotfix-7` с уже изменёнными `src/ui/header.css` и `docs/release-checklist.md`."
                    },
                    {
                        "id": "keep-next-step-observable",
                        "text": "Задача заканчивается на безопасной проверке branch-контекста. Делать `checkout` здесь ещё не нужно."
                    }
                ],
                "steps": [
                    {
                        "position": 1,
                        "title": "Подтвердите активную ветку",
                        "detail": "Первым шагом явно покажите, что работа уже открыта в `release/hotfix-7`."
                    },
                    {
                        "position": 2,
                        "title": "Сопоставьте ветку с изменёнными файлами",
                        "detail": "`src/ui/header.css` и `docs/release-checklist.md` выглядят как незавершённый hotfix-контекст, а не новая feature-задача."
                    },
                    {
                        "position": 3,
                        "title": "Соберите branch-aware status",
                        "detail": "Нужна короткая команда, которая показывает и ветку, и незавершённые изменения."
                    },
                    {
                        "position": 4,
                        "title": "Оставьте переключение на потом",
                        "detail": "После такой проверки уже можно будет обсуждать `checkout`, но этот сценарий завершается раньше."
                    }
                ],
                "annotations": [
                    {
                        "label": "Что проверяем",
                        "message": "Сначала подтверждаем активную ветку, потом убеждаемся, что в ней уже есть незавершённый hotfix."
                    },
                    {
                        "label": "Какой шаг ожидается",
                        "message": "Сценарий ведёт к branch-aware status, но только после явного подтверждения текущей ветки."
                    }
                ]
            },
            "repositoryContext": {
                "status": "authored-fixture",
                "branches": [
                    {
                        "name": "release/hotfix-7",
                        "current": true
                    },
                    {
                        "name": "feature/menu-refresh",
                        "current": false
                    },
                    {
                        "name": "main",
                        "current": false
                    }
                ],
                "commits": [
                    {
                        "id": "b74e2d0",
                        "summary": "hotfix: восстановить отступы заголовка"
                    },
                    {
                        "id": "197a0f4",
                        "summary": "release: отметить чеклист выкладки"
                    }
                ],
                "files": [
                    {
                        "path": "src/ui/header.css",
                        "status": "modified"
                    },
                    {
                        "path": "docs/release-checklist.md",
                        "status": "modified"
                    }
                ],
                "annotations": [
                    {
                        "label": "Что видно в репозитории",
                        "message": "Сейчас активна `release/hotfix-7`, и оба изменённых файла выглядят как незавершённая release-работа."
                    },
                    {
                        "label": "Почему нельзя переключаться сразу",
                        "message": "Пока вы не подтвердили текущую ветку и не увидели изменения рядом с ней, любой `checkout` смешивает hotfix и feature-контекст."
                    }
                ]
            }
        }
    },
    "history-cleanup-preview": {
        "id": "history-cleanup-preview",
        "slug": "history-cleanup-preview",
        "title": "Собери preview истории перед cleanup",
        "summary": "В `feature/history-cleanup` наверху лежат `fixup!` и WIP-коммиты. Сначала покажи компактный граф истории, а не запускай `rebase -i`.",
        "difficulty": "intermediate",
        "tags": [
            "history",
            "cleanup",
            "planning"
        ],
        "meta": {
            "source": "local-fixture",
            "stub": false
        },
        "workspace": {
            "shell": {
                "leftPanelTitle": "Карта сценария",
                "centerPanelTitle": "Урок",
                "rightPanelTitle": "Практика"
            },
            "task": {
                "status": "authored-fixture",
                "goal": "Нужно безопасно посмотреть верхушку истории и увидеть, какие коммиты пойдут в cleanup, не переписывая их.",
                "instructions": [
                    {
                        "id": "preview-commit-graph-before-rewrite",
                        "text": "Оставайтесь в режиме просмотра. Никакого `rebase`, `reset` или `commit --amend`."
                    },
                    {
                        "id": "use-fixup-and-wip-as-cues",
                        "text": "Команда должна явно показать `fixup!` и WIP рядом с основными коммитами, чтобы было видно будущий cleanup."
                    },
                    {
                        "id": "keep-next-step-in-preview-mode",
                        "text": "Лучший следующий шаг — компактный `git log` с графом и декорациями, без переписывания истории."
                    }
                ],
                "steps": [
                    {
                        "position": 1,
                        "title": "Посмотрите на верхушку ветки",
                        "detail": "Нужно увидеть последние коммиты в `feature/history-cleanup`, а не сразу планировать `rebase -i`."
                    },
                    {
                        "position": 2,
                        "title": "Найдите `fixup!` и WIP-сигналы",
                        "detail": "Именно эти коммиты подсказывают, какие части истории ещё надо будет уплотнить."
                    },
                    {
                        "position": 3,
                        "title": "Соберите компактный граф",
                        "detail": "Выберите такой `git log`, который показывает форму стека и декорации веток в одном выводе."
                    },
                    {
                        "position": 4,
                        "title": "Не переписывайте историю раньше времени",
                        "detail": "Сценарий заканчивается на preview. Переписывание коммитов остаётся следующим, но не текущим шагом."
                    },
                    {
                        "position": 5,
                        "title": "Сформулируйте основу для cleanup",
                        "detail": "После preview должно быть понятно, какие коммиты вы бы потом склеивали или переставляли."
                    }
                ],
                "annotations": [
                    {
                        "label": "Что нужно увидеть",
                        "message": "В истории уже видны `fixup!` и WIP-коммиты, поэтому сначала нужен понятный preview графа."
                    },
                    {
                        "label": "Какой шаг ожидается",
                        "message": "Правильный ответ — команда из семейства `git log`, которая ничего не меняет, но показывает форму истории."
                    }
                ]
            },
            "repositoryContext": {
                "status": "authored-fixture",
                "branches": [
                    {
                        "name": "feature/history-cleanup",
                        "current": true
                    },
                    {
                        "name": "main",
                        "current": false
                    }
                ],
                "commits": [
                    {
                        "id": "c102d6b",
                        "summary": "fixup! ui: переименовать бейдж оболочки"
                    },
                    {
                        "id": "91fe2ad",
                        "summary": "ui: переименовать бейдж оболочки"
                    },
                    {
                        "id": "43bc8c1",
                        "summary": "wip: ещё раз подправить отступы"
                    }
                ],
                "files": [
                    {
                        "path": "frontend/src/styles.css",
                        "status": "modified"
                    },
                    {
                        "path": "frontend/src/workspace-shell/view.js",
                        "status": "modified"
                    }
                ],
                "annotations": [
                    {
                        "label": "Сигнал для cleanup",
                        "message": "`fixup!` рядом с основным UI-коммитом и отдельный WIP уже показывают, что история просит аккуратного просмотра."
                    },
                    {
                        "label": "Почему rebase пока рано",
                        "message": "Пока вы не увидели стек в компактном графе, любой `rebase -i` скрывает обязательный шаг анализа."
                    }
                ]
            }
        }
    },
    "remote-sync-preview": {
        "id": "remote-sync-preview",
        "slug": "remote-sync-preview",
        "title": "Сначала обнови `origin/main` перед интеграцией",
        "summary": "Локальная `main` уже ушла вперёд, но данные об `origin/main` могут быть устаревшими. Сначала сделай `fetch`, а уже потом думай про `pull`.",
        "difficulty": "intermediate",
        "tags": [
            "remote",
            "inspection",
            "planning"
        ],
        "meta": {
            "source": "local-fixture",
            "stub": false
        },
        "workspace": {
            "shell": {
                "leftPanelTitle": "Карта сценария",
                "centerPanelTitle": "Урок",
                "rightPanelTitle": "Практика"
            },
            "task": {
                "status": "authored-fixture",
                "goal": "Сначала обновите remote-tracking refs и только после этого решайте, нужен ли `pull`, `merge` или `rebase`.",
                "instructions": [
                    {
                        "id": "refresh-remote-state-before-integration",
                        "text": "Не интегрируйте удалённые коммиты сразу. Первый шаг здесь — отдельный `fetch`."
                    },
                    {
                        "id": "treat-local-ahead-and-remote-behind-as-incomplete-view",
                        "text": "Задача не про `pull`; она про получение актуального состояния `origin/main`."
                    },
                    {
                        "id": "keep-next-step-in-preview-mode",
                        "text": "После команды локальная история не должна смешаться с удалённой: сначала только обновите refs."
                    }
                ],
                "steps": [
                    {
                        "position": 1,
                        "title": "Заметьте, что данные об `origin/main` могут устареть",
                        "detail": "По текущему контексту видно расхождение, но пока нет гарантии, что локальная картина удалённой ветки свежая."
                    },
                    {
                        "position": 2,
                        "title": "Обновите remote-tracking refs",
                        "detail": "Сделайте безопасный шаг, который получит свежие данные с удалённого репозитория без интеграции в локальную ветку."
                    },
                    {
                        "position": 3,
                        "title": "Отделите fetch от merge",
                        "detail": "После `fetch` уже можно будет обсуждать интеграцию, но не раньше."
                    },
                    {
                        "position": 4,
                        "title": "Оставьте решение о pull на следующий шаг",
                        "detail": "Этот сценарий заканчивается сразу после обновления удалённого состояния."
                    }
                ],
                "annotations": [
                    {
                        "label": "Что проверяем",
                        "message": "Сначала получаем свежие remote refs, затем уже оцениваем divergence."
                    },
                    {
                        "label": "Какой шаг ожидается",
                        "message": "Правильный ответ — команда из семейства `git fetch`, без `pull`, `merge` и `rebase`."
                    }
                ]
            },
            "repositoryContext": {
                "status": "authored-fixture",
                "branches": [
                    {
                        "name": "main",
                        "current": true
                    },
                    {
                        "name": "origin/main",
                        "current": false
                    }
                ],
                "commits": [
                    {
                        "id": "87d20aa",
                        "summary": "docs: уточнить чеклист синхронизации"
                    },
                    {
                        "id": "3fd81e5",
                        "summary": "feat: подготовить баннер статуса удалённого репозитория"
                    }
                ],
                "files": [
                    {
                        "path": "docs/sync-playbook.md",
                        "status": "clean"
                    },
                    {
                        "path": "frontend/src/banner.js",
                        "status": "clean"
                    }
                ],
                "annotations": [
                    {
                        "label": "Сигнал неполной картины",
                        "message": "Локальная `main` уже опережает известный `origin/main`, но на удалённом есть ещё не полученные изменения."
                    },
                    {
                        "label": "Почему `pull` пока рано",
                        "message": "`pull` смешивает получение новых данных и интеграцию. Сначала нужен отдельный `fetch`."
                    }
                ]
            }
        }
    },
    "stash-checkpoint-draft": {
        "id": "stash-checkpoint-draft",
        "slug": "stash-checkpoint-draft",
        "title": "Убери черновик в stash перед переключением",
        "summary": "В `feature/test-stash-panel` изменён `frontend/src/demo-panel.js` и появился новый `notes/ui-placeholder.txt`. Сначала проверь статус, затем сохрани всё в stash вместе с untracked-файлом.",
        "difficulty": "beginner",
        "tags": [
            "stash",
            "working-tree",
            "safety"
        ],
        "meta": {
            "source": "local-fixture",
            "stub": false
        },
        "workspace": {
            "shell": {
                "leftPanelTitle": "Карта сценария",
                "centerPanelTitle": "Урок",
                "rightPanelTitle": "Практика"
            },
            "task": {
                "status": "authored-fixture",
                "goal": "Нужно подтвердить, что в ветке есть и changed, и untracked файлы, а затем убрать их в stash так, чтобы рабочее дерево стало чистым.",
                "instructions": [
                    {
                        "id": "inspect-dirty-worktree-before-stash",
                        "text": "Сначала убедитесь, что в `feature/test-stash-panel` есть и изменённый tracked-файл, и новый untracked-файл."
                    },
                    {
                        "id": "include-untracked-files-in-checkpoint",
                        "text": "Stash должен забрать не только `frontend/src/demo-panel.js`, но и `notes/ui-placeholder.txt`."
                    },
                    {
                        "id": "leave-branch-ready-for-next-step",
                        "text": "После stash рабочее дерево должно стать чистым, чтобы ветку можно было безопасно переключать или продолжать позже."
                    }
                ],
                "steps": [
                    {
                        "position": 1,
                        "title": "Проверьте текущее грязное состояние",
                        "detail": "Перед stash зафиксируйте, что в репозитории есть и modified, и untracked изменения."
                    },
                    {
                        "position": 2,
                        "title": "Сохраните всё в stash",
                        "detail": "Выберите такую команду, которая уберёт и tracked, и untracked файлы в один checkpoint."
                    },
                    {
                        "position": 3,
                        "title": "Оставьте ветку чистой",
                        "detail": "После stash локальный шум должен исчезнуть, а изменения остаться доступными для возврата позже."
                    }
                ],
                "annotations": [
                    {
                        "label": "Что проверяем",
                        "message": "Обычный просмотр статуса допустим как промежуточный шаг, но задача завершается только после stash."
                    },
                    {
                        "label": "Какой результат нужен",
                        "message": "Нужно убрать в stash и изменённый файл, и новый untracked-файл, чтобы рабочее дерево стало чистым."
                    }
                ]
            },
            "repositoryContext": {
                "status": "authored-fixture",
                "branches": [
                    {
                        "name": "feature/test-stash-panel",
                        "current": true
                    },
                    {
                        "name": "main",
                        "current": false
                    }
                ],
                "commits": [
                    {
                        "id": "5d91af0",
                        "summary": "test: добавить временный контент для панели"
                    },
                    {
                        "id": "88ce113",
                        "summary": "ui: подготовить черновой блок навигации"
                    }
                ],
                "files": [
                    {
                        "path": "frontend/src/demo-panel.js",
                        "status": "modified"
                    },
                    {
                        "path": "notes/ui-placeholder.txt",
                        "status": "untracked"
                    }
                ],
                "annotations": [
                    {
                        "label": "Что лежит в рабочем дереве",
                        "message": "`frontend/src/demo-panel.js` уже изменён, а `notes/ui-placeholder.txt` существует только локально и тоже не должен потеряться."
                    },
                    {
                        "label": "Безопасный следующий шаг",
                        "message": "Сначала подтвердите статус, затем сохраните tracked и untracked изменения в stash."
                    }
                ]
            }
        }
    },
    "merge-sandbox-outline": {
        "id": "merge-sandbox-outline",
        "slug": "merge-sandbox-outline",
        "title": "Сравни diff перед попыткой merge",
        "summary": "Вы на `feature/mock-merge-window` с незавершёнными правками. Перед merge безопасно посмотреть diff с `main` или общий граф веток, а не запускать слияние сразу.",
        "difficulty": "intermediate",
        "tags": [
            "branching",
            "history",
            "planning"
        ],
        "meta": {
            "source": "local-fixture",
            "stub": false
        },
        "workspace": {
            "shell": {
                "leftPanelTitle": "Карта сценария",
                "centerPanelTitle": "Урок",
                "rightPanelTitle": "Практика"
            },
            "task": {
                "status": "authored-fixture",
                "goal": "Нужно понять, чем `feature/mock-merge-window` отличается от `main`, и сделать это через preview-команду, не выполняя merge.",
                "instructions": [
                    {
                        "id": "inspect-merge-shape",
                        "text": "Сначала подтвердите контекст ветки, а затем откройте preview различий или истории."
                    },
                    {
                        "id": "stay-in-preview-mode",
                        "text": "Задача заканчивается на просмотре diff или графа. Никакого `git merge` здесь выполнять не нужно."
                    },
                    {
                        "id": "use-test-copy",
                        "text": "Подойдёт команда, которая либо показывает diff между `main` и `feature/mock-merge-window`, либо строит понятный граф веток."
                    }
                ],
                "steps": [
                    {
                        "position": 1,
                        "title": "Подтвердите текущую ветку",
                        "detail": "Сначала зафиксируйте, что вы на `feature/mock-merge-window`, а не на `main` или `release/demo`."
                    },
                    {
                        "position": 2,
                        "title": "Сравните feature с `main`",
                        "detail": "Посмотрите, какие изменения накопились перед потенциальным merge, и не трогайте историю."
                    },
                    {
                        "position": 3,
                        "title": "Выберите diff или граф",
                        "detail": "Правильный ответ — безопасный preview: либо различия, либо граф веток."
                    },
                    {
                        "position": 4,
                        "title": "Оставьте merge на следующий шаг",
                        "detail": "После preview уже можно обсуждать слияние, но этот сценарий останавливается раньше."
                    }
                ],
                "annotations": [
                    {
                        "label": "Что проверяем",
                        "message": "Сначала нужно увидеть форму расхождения между `main` и `feature/mock-merge-window`, не меняя репозиторий."
                    },
                    {
                        "label": "Какой шаг ожидается",
                        "message": "Подойдёт `git diff main...feature/mock-merge-window` или просмотр полного графа веток."
                    }
                ]
            },
            "repositoryContext": {
                "status": "authored-fixture",
                "branches": [
                    {
                        "name": "feature/mock-merge-window",
                        "current": true
                    },
                    {
                        "name": "main",
                        "current": false
                    },
                    {
                        "name": "release/demo",
                        "current": false
                    }
                ],
                "commits": [
                    {
                        "id": "fbe4309",
                        "summary": "test: набросать фикстуру для merge preview"
                    },
                    {
                        "id": "2cc9b15",
                        "summary": "feat: добавить условный баннер синхронизации"
                    }
                ],
                "files": [
                    {
                        "path": "frontend/src/merge-banner.js",
                        "status": "modified"
                    },
                    {
                        "path": "docs/mock-merge-plan.md",
                        "status": "modified"
                    }
                ],
                "annotations": [
                    {
                        "label": "Что видно в репозитории",
                        "message": "Активна `feature/mock-merge-window`, рядом есть `main` и `release/demo`, а в рабочем дереве уже лежат незавершённые изменения."
                    },
                    {
                        "label": "Почему merge пока рано",
                        "message": "Без предварительного diff или графа вы не понимаете ни объём отличий, ни форму истории перед слиянием."
                    }
                ]
            }
        }
    },
    "tag-checkpoint-preview": {
        "id": "tag-checkpoint-preview",
        "slug": "tag-checkpoint-preview",
        "title": "Проверь релизные теги перед выбором точки",
        "summary": "История чистая, но в репозитории уже есть `release/demo-v1` и `checkpoint/ui-shell`. Сначала посмотри список тегов, а не создавай новый.",
        "difficulty": "beginner",
        "tags": [
            "navigation",
            "inspection",
            "remote"
        ],
        "meta": {
            "source": "local-fixture",
            "stub": false
        },
        "workspace": {
            "shell": {
                "leftPanelTitle": "Карта сценария",
                "centerPanelTitle": "Урок",
                "rightPanelTitle": "Практика"
            },
            "task": {
                "status": "authored-fixture",
                "goal": "Нужно безопасно увидеть существующие теги и выбрать ориентир для релизной точки, не меняя историю.",
                "instructions": [
                    {
                        "id": "inspect-tag-list",
                        "text": "Рабочее дерево чистое, поэтому задача не про правки, а про чтение уже существующих тегов."
                    },
                    {
                        "id": "keep-copy-light",
                        "text": "Команда должна показать, какие теги уже есть в репозитории: `release/demo-v1` и `checkpoint/ui-shell`."
                    },
                    {
                        "id": "prefer-read-only-command",
                        "text": "Не создавайте и не перемещайте теги. Сначала просто просмотрите список."
                    }
                ],
                "steps": [
                    {
                        "position": 1,
                        "title": "Убедитесь, что история чистая",
                        "detail": "Здесь не нужно сохранять изменения или переключать ветки: задача целиком про чтение ориентиров."
                    },
                    {
                        "position": 2,
                        "title": "Посмотрите существующие теги",
                        "detail": "Нужно явно увидеть, какие release/checkpoint-теги уже привязаны к истории."
                    },
                    {
                        "position": 3,
                        "title": "Выберите безопасный просмотр",
                        "detail": "Подойдёт read-only команда вроде `git tag --list` или `git show-ref --tags`."
                    }
                ],
                "annotations": [
                    {
                        "label": "Что проверяем",
                        "message": "Сценарий про выбор существующей контрольной точки, а не про создание нового тега."
                    },
                    {
                        "label": "Какой шаг ожидается",
                        "message": "Правильный ответ — безопасная команда просмотра списка тегов или tag refs."
                    }
                ]
            },
            "repositoryContext": {
                "status": "authored-fixture",
                "branches": [
                    {
                        "name": "main",
                        "current": true
                    },
                    {
                        "name": "origin/main",
                        "current": false
                    }
                ],
                "commits": [
                    {
                        "id": "11b7d31",
                        "summary": "test: добавить условный тег релизного ориентира"
                    },
                    {
                        "id": "d34aa0c",
                        "summary": "docs: обновить заметки по контрольным точкам"
                    }
                ],
                "files": [
                    {
                        "path": "docs/release-tags.md",
                        "status": "clean"
                    },
                    {
                        "path": "frontend/src/tag-chip.js",
                        "status": "clean"
                    }
                ],
                "annotations": [
                    {
                        "label": "Что уже есть в истории",
                        "message": "Рабочее дерево чистое, а в истории уже подготовлены как минимум два тега: `release/demo-v1` и `checkpoint/ui-shell`."
                    },
                    {
                        "label": "Почему не нужно создавать тег сразу",
                        "message": "Сначала надо понять, какие ориентиры уже существуют, и только потом решать, нужен ли новый тег."
                    }
                ]
            }
        }
    }
});
