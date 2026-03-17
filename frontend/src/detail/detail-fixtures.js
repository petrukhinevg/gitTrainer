export const FIXTURE_SCENARIO_DETAILS = Object.freeze({
    "status-basics": {
        id: "status-basics",
        slug: "status-basics",
        title: "Сначала проверь рабочее дерево",
        summary: "Посмотри на шумный репозиторий и выбери следующую безопасную Git-команду до любых изменений.",
        difficulty: "beginner",
        tags: ["status", "working-tree", "basics"],
        meta: {
            source: "local-fixture",
            stub: false
        },
        workspace: {
            shell: {
                leftPanelTitle: "Карта сценария",
                centerPanelTitle: "Урок",
                rightPanelTitle: "Практика"
            },
            task: {
                status: "authored-fixture",
                goal: "Прочитайте состояние репозитория, прежде чем выбирать первую безопасную Git-команду.",
                instructions: [
                    {
                        id: "check-branch",
                        text: "Уточните, какая ветка сейчас активна, прежде чем решать, нужно ли вообще переключение."
                    },
                    {
                        id: "read-short-status",
                        text: "Посмотрите краткий `status` и отметьте, какие файлы изменены, а какие ещё не отслеживаются."
                    },
                    {
                        id: "protect-worktree",
                        text: "Избегайте команд, которые меняют историю или выбрасывают работу, пока дерево ещё только проверяется."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Определите текущую ветку",
                        detail: "Сначала посмотрите на активную ветку, чтобы не терять ориентацию до предложения любой команды."
                    },
                    {
                        position: 2,
                        title: "Соберите сигналы рабочего дерева",
                        detail: "Зафиксируйте, какие пути изменены, не отслеживаются или уже проиндексированы, чтобы следующий шаг опирался на факты."
                    },
                    {
                        position: 3,
                        title: "Выберите самый безопасный первый шаг",
                        detail: "Подберите первую Git-команду, которая собирает информацию и не меняет историю репозитория."
                    }
                ],
                annotations: [
                    {
                        label: "Целевой результат",
                        message: "Нужно обосновать безопасную первую команду, а не сразу переходить к очистке."
                    },
                    {
                        label: "Подсказка по безопасности",
                        message: "В этом сценарии проверка идёт раньше любых изменений."
                    }
                ]
            },
            repositoryContext: {
                status: "authored-fixture",
                branches: [
                    { name: "main", current: true },
                    { name: "docs/review-notes", current: false }
                ],
                commits: [
                    { id: "a1c9e31", summary: "docs: добавить черновик заметок по ревью" },
                    { id: "f72ab44", summary: "app: удержать оболочку рабочего пространства стабильной" }
                ],
                files: [
                    { path: "README.md", status: "modified" },
                    { path: "notes/status-checklist.md", status: "untracked" },
                    { path: "src/main.js", status: "modified" }
                ],
                annotations: [
                    { label: "Подсказка рабочего дерева", message: "Два отслеживаемых файла изменены, а один файл с чеклистом всё ещё не отслеживается." },
                    { label: "Подсказка для решения", message: "В этом сценарии ценится команда проверки до любого `stage` или очистки." }
                ]
            }
        }
    },
    "branch-safety": {
        id: "branch-safety",
        slug: "branch-safety",
        title: "Выбери правильную ветку перед правками",
        summary: "Определи активную ветку, сопоставь её с задачей и реши, оставаться ли на месте или сначала переключиться.",
        difficulty: "beginner",
        tags: ["branching", "navigation", "basics"],
        meta: {
            source: "local-fixture",
            stub: false
        },
        workspace: {
            shell: {
                leftPanelTitle: "Карта сценария",
                centerPanelTitle: "Урок",
                rightPanelTitle: "Практика"
            },
            task: {
                status: "authored-fixture",
                goal: "Решите, продолжать ли задачу на текущей ветке или после переключения.",
                instructions: [
                    {
                        id: "read-current-branch",
                        text: "Посмотрите на текущую ветку до любых правок файлов или индексации."
                    },
                    {
                        id: "compare-task-intent",
                        text: "Сопоставьте назначение ветки с задачей, чтобы обосновать, оставаться ли на месте или переключаться."
                    },
                    {
                        id: "avoid-implicit-switch",
                        text: "Не считайте переключение ветки правильным, пока состояние репозитория и цель задачи не совпадут."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Поймите, где вы находитесь",
                        detail: "Начните с активной ветки и сигналов того, что рабочее дерево уже используется."
                    },
                    {
                        position: 2,
                        title: "Сопоставьте ветку и задачу",
                        detail: "Свяжите имя текущей ветки с описанием задачи, прежде чем предлагать `checkout`."
                    },
                    {
                        position: 3,
                        title: "Сформулируйте решение по ветке",
                        detail: "Кратко объясните, нужно ли остаться на ветке или переключиться и почему это безопаснее."
                    }
                ],
                annotations: [
                    {
                        label: "Граница решения",
                        message: "Навигация по веткам должна быть осознанной и объяснённой, а не автоматической."
                    }
                ]
            },
            repositoryContext: {
                status: "authored-fixture",
                branches: [
                    { name: "release/hotfix-7", current: true },
                    { name: "feature/menu-refresh", current: false },
                    { name: "main", current: false }
                ],
                commits: [
                    { id: "b74e2d0", summary: "hotfix: восстановить отступы заголовка" },
                    { id: "197a0f4", summary: "release: отметить чеклист выкладки" }
                ],
                files: [
                    { path: "src/ui/header.css", status: "modified" },
                    { path: "docs/release-checklist.md", status: "modified" }
                ],
                annotations: [
                    { label: "Назначение ветки", message: "Текущая ветка предназначена для hotfix и уже содержит изменения, связанные с релизом." },
                    { label: "Напряжение задачи", message: "Нужно решить, относится ли запрошенная работа сюда или должна идти в feature-ветку." }
                ]
            }
        }
    },
    "history-cleanup-preview": {
        id: "history-cleanup-preview",
        slug: "history-cleanup-preview",
        title: "Просмотри план очистки истории",
        summary: "Разбери запутанный стек коммитов и подготовься к дальнейшей очистке, пока ещё не меняя историю.",
        difficulty: "intermediate",
        tags: ["history", "cleanup", "planning"],
        meta: {
            source: "local-fixture",
            stub: false
        },
        workspace: {
            shell: {
                leftPanelTitle: "Карта сценария",
                centerPanelTitle: "Урок",
                rightPanelTitle: "Практика"
            },
            task: {
                status: "authored-fixture",
                goal: "Подготовьте последовательный план очистки, пока ещё не переписывая историю.",
                instructions: [
                    {
                        id: "inspect-commit-stack",
                        text: "Посмотрите на недавний стек коммитов и найдите повторяющиеся или неаккуратные изменения."
                    },
                    {
                        id: "plan-before-rewrite",
                        text: "Опишите последовательность очистки до выбора любой команды переписывания истории."
                    },
                    {
                        id: "keep-remote-risk-visible",
                        text: "Учитывайте, могли ли переписываемые коммиты уже быть опубликованы другим."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Прочитайте стек сверху вниз",
                        detail: "Сначала пройдитесь по текущей истории по порядку и только потом предлагайте план очистки."
                    },
                    {
                        position: 2,
                        title: "Сгруппируйте цели очистки",
                        detail: "Разделите кандидатов на `fixup`, кандидатов на перестановку и коммиты, которые трогать не нужно."
                    },
                    {
                        position: 3,
                        title: "Назовите безопасный следующий шаг",
                        detail: "Выберите команду планирования или проверки, которая должна идти до любого переписывания."
                    }
                ],
                annotations: [
                    {
                        label: "Режим планирования",
                        message: "Эта задача заканчивается на качестве плана и не выполняет переписывание."
                    }
                ]
            },
            repositoryContext: {
                status: "authored-fixture",
                branches: [
                    { name: "feature/history-cleanup", current: true },
                    { name: "main", current: false }
                ],
                commits: [
                    { id: "c102d6b", summary: "fixup! ui: переименовать бейдж оболочки" },
                    { id: "91fe2ad", summary: "ui: переименовать бейдж оболочки" },
                    { id: "43bc8c1", summary: "wip: ещё раз подправить отступы" }
                ],
                files: [
                    { path: "frontend/src/styles.css", status: "modified" },
                    { path: "frontend/src/workspace-shell/view.js", status: "modified" }
                ],
                annotations: [
                    { label: "Подсказка по истории", message: "Среди последних коммитов есть `fixup` и лишнее WIP-изменение, что намекает на будущую очистку." },
                    { label: "Подсказка по безопасности", message: "Пользователь всё ещё находится в режиме планирования и не должен переписывать историю." }
                ]
            }
        }
    },
    "remote-sync-preview": {
        id: "remote-sync-preview",
        slug: "remote-sync-preview",
        title: "Проверь удалённое состояние перед pull",
        summary: "Сравни признаки опережения и отставания и реши, что уместнее перед синхронизацией: fetch или pull.",
        difficulty: "intermediate",
        tags: ["remote", "inspection", "planning"],
        meta: {
            source: "local-fixture",
            stub: false
        },
        workspace: {
            shell: {
                leftPanelTitle: "Карта сценария",
                centerPanelTitle: "Урок",
                rightPanelTitle: "Практика"
            },
            task: {
                status: "authored-fixture",
                goal: "Объясните следующую команду для синхронизации после чтения признаков опережения или отставания.",
                instructions: [
                    {
                        id: "check-tracking",
                        text: "Посмотрите, как локальная ветка соотносится с отслеживаемой удалённой веткой."
                    },
                    {
                        id: "read-divergence",
                        text: "Определите, опережает ветка, отстаёт или разошлась, прежде чем выбирать команду синхронизации."
                    },
                    {
                        id: "separate-fetch-from-merge",
                        text: "Разделяйте решения о `fetch` и `merge`, пока состояние репозитория не стало понятным."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Проверьте связь с отслеживаемой удалённой веткой",
                        detail: "Сначала прочитайте состояние отслеживаемой удалённой ветки и только потом предлагайте `pull` или `fetch`."
                    },
                    {
                        position: 2,
                        title: "Интерпретируйте опережение и отставание",
                        detail: "Используйте признаки опережения или отставания, чтобы объяснить, нужна ли интеграция прямо сейчас."
                    },
                    {
                        position: 3,
                        title: "Выберите команду синхронизации",
                        detail: "Назовите самый безопасный следующий шаг, исходя из того, нужно ли сначала получить новые данные с удалённого репозитория."
                    }
                ],
                annotations: [
                    {
                        label: "Дисциплина работы с удалённым репозиторием",
                        message: "Получение информации и интеграция изменений в этом упражнении рассматриваются как разные решения."
                    }
                ]
            },
            repositoryContext: {
                status: "authored-fixture",
                branches: [
                    { name: "main", current: true },
                    { name: "origin/main", current: false }
                ],
                commits: [
                    { id: "87d20aa", summary: "docs: уточнить чеклист синхронизации" },
                    { id: "3fd81e5", summary: "feat: подготовить баннер статуса удалённого репозитория" }
                ],
                files: [
                    { path: "docs/sync-playbook.md", status: "clean" },
                    { path: "frontend/src/banner.js", status: "clean" }
                ],
                annotations: [
                    { label: "Подсказка по удалённому репозиторию", message: "Локальная `main` опережает на один коммит, а в `origin/main` есть ещё не полученные удалённые изменения." },
                    { label: "Подсказка для решения", message: "Нужно решить, стоит ли сначала выполнить `fetch`, прежде чем выбирать интегрирующую команду." }
                ]
            }
        }
    }
});
