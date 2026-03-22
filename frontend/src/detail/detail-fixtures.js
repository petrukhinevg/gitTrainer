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
                goal: "Сначала проверьте состояние рабочего дерева и только после этого выбирайте следующий шаг.",
                instructions: [
                    {
                        id: "inspect-working-tree-first",
                        text: "Начните с команды проверки состояния, а не с переключения ветки или изменения файлов."
                    },
                    {
                        id: "confirm-short-status-signals",
                        text: "Сверьте краткий `git status --short` и зафиксируйте, какие файлы изменены, а какие ещё не отслеживаются."
                    },
                    {
                        id: "avoid-mutation-commands",
                        text: "Избегайте команд, которые меняют историю или рабочее дерево, пока не подтверждён безопасный шаг проверки."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Начните с проверки рабочего дерева",
                        detail: "Первая команда должна только читать состояние репозитория и ничего не менять."
                    },
                    {
                        position: 2,
                        title: "Сверьте сигналы short-статуса",
                        detail: "Подтвердите по `git status --short`, какие пути изменены и какие остаются неотслеживаемыми."
                    },
                    {
                        position: 3,
                        title: "Зафиксируйте безопасный первый шаг",
                        detail: "Для этого сценария ожидается команда из семейства `git status` как честный следующий шаг."
                    },
                    {
                        position: 4,
                        title: "Добавьте тестовую проверку формулировки",
                        detail: "Этот дополнительный шаг нужен только для проверки более длинного списка подзадач в левой колонке."
                    },
                    {
                        position: 5,
                        title: "Оставьте финал без изменений состояния",
                        detail: "Даже тестовое продолжение списка должно оставаться в режиме чтения репозитория, а не выполнения изменений."
                    }
                ],
                annotations: [
                    {
                        label: "Целевой результат",
                        message: "Нужно показать безопасную проверку рабочего дерева до любого stage, checkout или очистки."
                    },
                    {
                        label: "Подсказка по проверке",
                        message: "Здесь оценивается команда проверки состояния (`git status`), а не команда изменения."
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
                    },
                    {
                        position: 4,
                        title: "Добавьте тестовый комментарий к выбору",
                        detail: "Этот шаг расширяет список задач для проверки UI и не требует новой смысловой развилки."
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
                    },
                    {
                        position: 4,
                        title: "Оставьте ещё один тестовый ориентир",
                        detail: "Дополнительная подзадача удерживает длинный список в навигации и проверяет стабильность раскрытого состояния."
                    },
                    {
                        position: 5,
                        title: "Завершите план условным черновиком",
                        detail: "Пусть финальный пункт останется тестовым: он нужен, чтобы у родителя было больше дочерних элементов, как в реальной структуре."
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
                    },
                    {
                        position: 4,
                        title: "Проверьте тестовый пост-скрипт решения",
                        detail: "Ещё один шаг добавлен только для проверки длинных веток навигации и не меняет общий смысл сценария."
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
    },
    "stash-checkpoint-draft": {
        id: "stash-checkpoint-draft",
        slug: "stash-checkpoint-draft",
        title: "Тестовый блок про временное сохранение",
        summary: "Добавочный fixture-блок для проверки UI: ещё один родитель с несколькими дочерними шагами и нейтральным текстом.",
        difficulty: "beginner",
        tags: ["status", "cleanup", "planning"],
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
                goal: "Проверить, что новый тестовый родитель отображается и разворачивается так же, как остальные сценарии.",
                instructions: [
                    {
                        id: "read-placeholder-context",
                        text: "Прочитайте тестовый контекст и убедитесь, что блок ведёт себя как обычный authored fixture."
                    },
                    {
                        id: "keep-sandbox-tone",
                        text: "Текст может быть условным, но структура должна оставаться такой же, как у остальных сценариев."
                    },
                    {
                        id: "preserve-subtask-shape",
                        text: "Каждая дочерняя задача нужна для проверки раскрытия, переходов по focus и визуальной линии навигации."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Прочитайте тестовое описание",
                        detail: "Первый шаг ничего не доказывает по Git-смыслу, но нужен для проверки общего шаблона контента."
                    },
                    {
                        position: 2,
                        title: "Откройте дочерние пункты в навигации",
                        detail: "Этот пункт нужен, чтобы у нового родителя было несколько ссылок focus и он выглядел как существующие блоки."
                    },
                    {
                        position: 3,
                        title: "Сверьте нейтральную команду",
                        detail: "Для локального fixture-режима здесь можно использовать безопасную тестовую команду из семейства `git stash`."
                    }
                ],
                annotations: [
                    {
                        label: "Тестовое назначение",
                        message: "Сценарий добавлен только для проверки UI и локальных fixture-flow, без строгой предметной нагрузки."
                    }
                ]
            },
            repositoryContext: {
                status: "authored-fixture",
                branches: [
                    { name: "feature/test-stash-panel", current: true },
                    { name: "main", current: false }
                ],
                commits: [
                    { id: "5d91af0", summary: "test: добавить временный контент для панели" },
                    { id: "88ce113", summary: "ui: подготовить черновой блок навигации" }
                ],
                files: [
                    { path: "frontend/src/demo-panel.js", status: "modified" },
                    { path: "notes/ui-placeholder.txt", status: "untracked" }
                ],
                annotations: [
                    { label: "Контекст для теста", message: "Данные подобраны так, чтобы сценарий выглядел правдоподобно, но не требовал настоящего доменного смысла." },
                    { label: "Безопасный следующий шаг", message: "В local fixture здесь достаточно тестовой команды из области stash." }
                ]
            }
        }
    },
    "merge-sandbox-outline": {
        id: "merge-sandbox-outline",
        slug: "merge-sandbox-outline",
        title: "Тестовый блок про слияние без спешки",
        summary: "Служебный сценарий для тестирования навигации: раскрывается как обычный блок, но несёт упрощённый учебный текст.",
        difficulty: "intermediate",
        tags: ["branching", "history", "planning"],
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
                goal: "Добавить ещё один родительский блок со средней длиной списка шагов и привычным устройством данных.",
                instructions: [
                    {
                        id: "inspect-merge-shape",
                        text: "Сначала считайте фикстурный контекст и не пытайтесь превращать этот блок в полноценный merge-тренажёр."
                    },
                    {
                        id: "stay-in-preview-mode",
                        text: "Как и в других preview-сценариях, здесь достаточно безопасного шага чтения и общего плана."
                    },
                    {
                        id: "use-test-copy",
                        text: "Текст оставлен нейтральным специально, чтобы его можно было использовать для визуального тестирования разных состояний."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Соберите тестовый контекст веток",
                        detail: "Первый шаг нужен для одинаковой структуры: у сценария есть обзор, а затем несколько дочерних подзадач."
                    },
                    {
                        position: 2,
                        title: "Посмотрите на форму истории",
                        detail: "Этот шаг имитирует чтение графа коммитов и даёт ещё одну точку перехода в сайдбаре."
                    },
                    {
                        position: 3,
                        title: "Выберите нейтральный следующий шаг",
                        detail: "Для локальной проверки достаточно безвредной команды чтения истории, которая не меняет репозиторий."
                    },
                    {
                        position: 4,
                        title: "Оставьте запасной тестовый шаг",
                        detail: "Дополнительный пункт нужен только для проверки длинной раскрытой группы и анимации списка."
                    }
                ],
                annotations: [
                    {
                        label: "Назначение блока",
                        message: "Этот сценарий расширяет тестовую карту и повторяет устройство существующих authored fixtures."
                    }
                ]
            },
            repositoryContext: {
                status: "authored-fixture",
                branches: [
                    { name: "feature/mock-merge-window", current: true },
                    { name: "main", current: false },
                    { name: "release/demo", current: false }
                ],
                commits: [
                    { id: "fbe4309", summary: "test: набросать фикстуру для merge preview" },
                    { id: "2cc9b15", summary: "feat: добавить условный баннер синхронизации" }
                ],
                files: [
                    { path: "frontend/src/merge-banner.js", status: "modified" },
                    { path: "docs/mock-merge-plan.md", status: "modified" }
                ],
                annotations: [
                    { label: "Тестовая ветка", message: "Данные репозитория оставлены условными, чтобы блок выглядел как обычный учебный сценарий." },
                    { label: "Подход к ответу", message: "В локальном режиме здесь достаточно команды просмотра истории или различий." }
                ]
            }
        }
    },
    "tag-checkpoint-preview": {
        id: "tag-checkpoint-preview",
        slug: "tag-checkpoint-preview",
        title: "Тестовый блок про теги и ориентиры",
        summary: "Ещё один fixture-родитель для проверки длинной ленты: внутри только тестовые шаги без особой смысловой нагрузки.",
        difficulty: "beginner",
        tags: ["navigation", "inspection", "remote"],
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
                goal: "Проверить ещё один короткий сценарий с двумя-тремя шагами, чтобы лента родителей стала длиннее.",
                instructions: [
                    {
                        id: "inspect-tag-list",
                        text: "Посмотрите на список ориентиров и убедитесь, что UI корректно обрабатывает дополнительный fixture-сценарий."
                    },
                    {
                        id: "keep-copy-light",
                        text: "Здесь допустим нейтральный тестовый текст, если структура поля и секций совпадает с остальными сценариями."
                    },
                    {
                        id: "prefer-read-only-command",
                        text: "Следующий шаг всё так же должен быть безопасным и не менять историю в локальной сессии."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Откройте список тестовых ориентиров",
                        detail: "Первая подзадача существует для структуры и не требует содержательного решения сверх проверки чтения."
                    },
                    {
                        position: 2,
                        title: "Сверьте условный тег с описанием",
                        detail: "Этот шаг добавляет ещё одну focus-ссылку и помогает проверить переходы между соседними родителями."
                    },
                    {
                        position: 3,
                        title: "Назовите безопасную команду просмотра",
                        detail: "Для локального режима здесь достаточно команды чтения вроде `git tag --list` или похожего безопасного просмотра."
                    }
                ],
                annotations: [
                    {
                        label: "Fixture-нагрузка",
                        message: "Сценарий добавлен для тестирования длины маршрута и поведения левой колонки."
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
                    { id: "11b7d31", summary: "test: добавить условный тег релизного ориентира" },
                    { id: "d34aa0c", summary: "docs: обновить заметки по контрольным точкам" }
                ],
                files: [
                    { path: "docs/release-tags.md", status: "clean" },
                    { path: "frontend/src/tag-chip.js", status: "clean" }
                ],
                annotations: [
                    { label: "Тестовая проверка", message: "Контекст сделан спокойным, чтобы сценарий можно было использовать просто как дополнительный навигационный узел." },
                    { label: "Подсказка по ответу", message: "В локальном режиме ожидается безопасный просмотр списка тегов." }
                ]
            }
        }
    }
});
