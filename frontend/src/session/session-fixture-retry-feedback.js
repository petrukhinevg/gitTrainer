import { normalizeOptionalSessionValue } from "./session-transport-error.js";

export function createPlaceholderRetryFeedback({
    scenarioSlug = null,
    attemptNumber = 0,
    outcome = null,
    answer = null
} = {}) {
    const correctness = normalizeOptionalSessionValue(outcome?.correctness);
    const retryStateStatus = correctness === null
        ? "idle"
        : correctness === "correct"
            ? "complete"
            : "retry-available";
    const eligibility = correctness === null || correctness === "correct"
        ? "not-needed"
        : "eligible";
    const guidedPresentation = createFixtureRetryPresentation({
        scenarioSlug,
        attemptNumber,
        outcome,
        answer
    });

    return {
        status: guidedPresentation.status,
        retryState: {
            status: retryStateStatus,
            attemptNumber,
            eligibility
        },
        explanation: guidedPresentation.explanation,
        hint: guidedPresentation.hint
    };
}

export function createFixtureRetryPresentation({ scenarioSlug, attemptNumber, outcome, answer }) {
    const correctness = normalizeOptionalSessionValue(outcome?.correctness);
    if (!correctness) {
        return {
            status: "placeholder",
            explanation: {
                status: "placeholder",
                title: "Подсказка для повтора",
                tone: "neutral",
                message: "Подсказка для повтора появится здесь после первой проверенной отправки.",
                details: []
            },
            hint: {
                status: "placeholder",
                level: "baseline",
                message: "Прогресс подсказок остаётся в ожидании, пока пользователь не получит проверенную обратную связь.",
                reveals: []
            }
        };
    }

    if (correctness === "correct") {
        return {
            status: "resolved",
            explanation: {
                status: "resolved",
                title: "Повторное объяснение не требуется",
                tone: "success",
                message: "Эта попытка уже привела к безопасному следующему шагу, поэтому панель повтора остаётся спокойной.",
                details: []
            },
            hint: {
                status: "resolved",
                level: "none",
                message: "После правильного ответа дополнительная подсказка не нужна.",
                reveals: []
            }
        };
    }

    const strongHintUnlocked = attemptNumber >= 2;
    const narrative = scenarioGuidanceNarrative(scenarioSlug, correctness, answer);

    return {
        status: "guided",
        explanation: {
            status: "guided",
            title: narrative.title,
            tone: correctness,
            message: narrative.message,
            details: narrative.details
        },
        hint: {
            status: "guided",
            level: strongHintUnlocked ? "strong" : "nudge",
            message: strongHintUnlocked
                ? "Теперь доступна усиленная подсказка, потому что пользователь уже промахнулся как минимум один раз."
                : "Сначала дайте более мягкий намёк, а уже потом открывайте сильную подсказку.",
            reveals: strongHintUnlocked
                ? [
                    {
                        id: "nudge",
                        label: "Показать первую подсказку",
                        title: narrative.nudgeTitle,
                        message: narrative.nudgeMessage
                    },
                    {
                        id: "strong",
                        label: "Показать усиленную подсказку",
                        title: narrative.strongTitle,
                        message: narrative.strongMessage
                    }
                ]
                : [
                    {
                        id: "nudge",
                        label: "Показать первую подсказку",
                        title: narrative.nudgeTitle,
                        message: narrative.nudgeMessage
                    }
                ]
        }
    };
}

function scenarioGuidanceNarrative(scenarioSlug, correctness, answer) {
    const trimmedAnswer = normalizeOptionalSessionValue(answer) ?? "отправленная команда";

    if (correctness === "unsupported") {
        return {
            title: "Вернитесь к поддерживаемому вводу команды",
            message: "Сейчас проверяются только ответы в виде команды, поэтому перед следующей попыткой нужно вернуть поддерживаемый формат.",
            details: [
                "Запрос принимается, но такой тип ответа всё ещё считается неподдерживаемым.",
                "Панель повтора должна сначала вернуть пользователя к поддерживаемому командному формату, а уже потом пробовать более богатые варианты ответа."
            ],
            nudgeTitle: "Используйте режим текста команды",
            nudgeMessage: "Переключите тип ответа обратно на текст команды и оставьте следующую попытку в форме простой команды проверки.",
            strongTitle: "Ориентируйтесь на поддерживаемый пример",
            strongMessage: "Посмотрите на бейдж поддерживаемого типа ответа над формой и сначала вернитесь к этому режиму."
        };
    }

    if (correctness === "partial") {
        return {
            title: "Вы смотрите в правильную область, но команду ещё нужно уточнить",
            message: `\`${trimmedAnswer}\` указывает на правильный сигнал репозитория, но задаче всё ещё нужна более точная команда проверки, прежде чем ответ станет правильным.`,
            details: [
                "Пользователь уже стартовал из правильного семейства команд проверки, поэтому сообщение о повторе должно поддержать это направление, а не считать ответ полным промахом.",
                "Следующая подсказка может сузить форму команды, не меняя саму панель обратной связи."
            ],
            nudgeTitle: "Останьтесь в том же семействе проверок",
            nudgeMessage: "Оставайтесь в той же зоне проверки, но уберите лишний охват или переключитесь на каноничную безопасную команду для сценария.",
            strongTitle: "Сверьтесь с точным безопасным шагом",
            strongMessage: "Следующее безопасное действие всё ещё строится на команде проверки. Уточните её, пока она не совпадёт с ожидаемым текстом."
        };
    }

    switch (scenarioSlug) {
        case "status-basics":
            return {
                title: "Сначала проверьте рабочее дерево, а не изменяйте репозиторий",
                message: "В этом сценарии ожидается команда из семейства `git status`, потому что задача про безопасную проверку текущего состояния перед любым действием.",
                details: [
                    "Контекст задания специально показывает изменённые и неотслеживаемые файлы, чтобы ответ опирался на наблюдаемые сигналы рабочего дерева.",
                    "Следующая попытка должна оставаться в режиме проверки состояния и не переходить к stage, checkout или очистке."
                ],
                nudgeTitle: "Начните с `git status`",
                nudgeMessage: "Выберите команду `git status` (или её краткий вариант), чтобы прочитать состояние рабочего дерева перед любыми изменениями.",
                strongTitle: "Используйте краткий просмотр состояния",
                strongMessage: "Если сомневаетесь, отправьте `git status --short`: этот шаг напрямую подтверждает изменённые и неотслеживаемые файлы из контекста."
            };
        case "branch-safety":
            return {
                title: "Выбор ветки всё ещё не опирается на контекст задачи",
                message: "Объяснение для повтора должно вернуть пользователя к сравнению активной ветки с задачей до любого переключения или редактирования.",
                details: [
                    "Текущая ветка уже несёт свой смысл. Следующая попытка должна объяснить этот смысл, а не сразу прыгать к смене ветки.",
                    "Хорошая подсказка в этом месте держит назначение ветки и цель задачи в одном фокусе."
                ],
                nudgeTitle: "Сначала прочитайте назначение ветки",
                nudgeMessage: "Используйте текущую ветку и подсказки репозитория, чтобы обосновать, безопаснее ли остаться или переключиться, прежде чем отправлять новую команду.",
                strongTitle: "Привяжите ответ к индикатору активной ветки",
                strongMessage: "Самая безопасная следующая команда всё ещё должна подтверждать, где вы находитесь. Используйте подсказку активной ветки до любого движения."
            };
        case "history-cleanup-preview":
            return {
                title: "Объяснение для повтора должно удержать пользователя в режиме планирования",
                message: "Этот сценарий всё ещё про чтение стека коммитов и план очистки, поэтому следующая попытка не должна слишком рано переходить к переписыванию истории.",
                details: [
                    "Объяснение должно напомнить, что эта задача заканчивается на проверке и планировании, а не на выполнении.",
                    "Подсказки могут постепенно переходить от общего языка планирования к более сильному напоминанию о log-подобных командах проверки."
                ],
                nudgeTitle: "Останьтесь на команде проверки истории",
                nudgeMessage: "Используйте команду в стиле `log`, которая держит стек коммитов на виду до выбора стратегии переписывания.",
                strongTitle: "Предпочтите украшенный однострочный просмотр истории",
                strongMessage: "Безопасный следующий шаг всё ещё строится на компактной команде проверки истории, которая показывает декорации веток до любой очистки."
            };
        case "remote-sync-preview":
            return {
                title: "Сначала обновите картину удалённого репозитория",
                message: "В этом сценарии повтор должен возвращать пользователя к безопасному чтению удалённого состояния до любой интеграции локальной ветки.",
                details: [
                    "Сигналы ahead/behind в этом упражнении важнее немедленного `pull`, потому что они определяют, нужен ли сначала `fetch`.",
                    "Следующая попытка должна удерживать пользователя в дисциплине разделения чтения удалённого состояния и слияния изменений."
                ],
                nudgeTitle: "Сначала получите свежие данные",
                nudgeMessage: "Подумайте о команде `git fetch`, прежде чем предлагать объединение или ребейз.",
                strongTitle: "Остановитесь на безопасном `fetch`",
                strongMessage: "Для этого fixture-сценария достаточно команды `git fetch` или близкого безопасного варианта чтения удалённого состояния."
            };
        case "stash-checkpoint-draft":
            return {
                title: "Сначала уберите и changed, и untracked файлы в stash",
                message: "В этой задаче нужно не просто посмотреть статус, а сохранить и `frontend/src/demo-panel.js`, и `notes/ui-placeholder.txt` в один stash-checkpoint, чтобы рабочее дерево стало чистым.",
                details: [
                    "Промежуточный `git status` допустим, но он ещё не завершает сценарий.",
                    "Следующая попытка должна оставаться в области `git stash` и обязательно учитывать untracked-файл."
                ],
                nudgeTitle: "Выберите stash с untracked-файлами",
                nudgeMessage: "Подумайте о команде `git stash`, которая убирает не только изменённый tracked-файл, но и новый локальный файл.",
                strongTitle: "Используйте `git stash push -u`",
                strongMessage: "Если нужен точный safe-ответ для local fixture, отправьте `git stash push -u`."
            };
        case "merge-sandbox-outline":
            return {
                title: "Сначала посмотрите diff или граф, а не запускайте merge",
                message: "Этот сценарий просит безопасно сравнить `feature/mock-merge-window` с `main` через preview-команду. Сам merge пока выполнять рано.",
                details: [
                    "Нужно понять форму различий между ветками, прежде чем делать слияние.",
                    "Следующая попытка должна оставаться на чтении diff или графа истории, без изменения репозитория."
                ],
                nudgeTitle: "Выберите preview различий",
                nudgeMessage: "Подойдёт команда, которая показывает diff с `main` или общий граф веток перед merge.",
                strongTitle: "Покажите diff или полный граф",
                strongMessage: "В local fixture точным ответом будет `git diff main...feature/mock-merge-window` или `git log --oneline --graph --decorate --all`."
            };
        case "tag-checkpoint-preview":
            return {
                title: "Сначала посмотрите, какие теги уже существуют",
                message: "Задача не просит создавать новый тег. Сначала нужно увидеть уже существующие `release/demo-v1` и `checkpoint/ui-shell` безопасной read-only командой.",
                details: [
                    "Рабочее дерево чистое, поэтому сценарий целиком про чтение существующих ориентиров истории.",
                    "Следующая попытка должна оставаться на просмотре списка тегов или tag refs."
                ],
                nudgeTitle: "Покажите список тегов",
                nudgeMessage: "Оставайтесь на безопасной команде просмотра вроде `git tag --list` или `git show-ref --tags`.",
                strongTitle: "Используйте `git tag --list`",
                strongMessage: "Если нужен точный fixture-ответ, отправьте `git tag --list`."
            };
        default:
            return {
                title: "Сначала проверьте, потом действуйте",
                message: "Объяснение для повтора должно возвращать пользователя к проверке репозитория до любого изменяющего Git-действия.",
                details: [
                    "Этот блок обратной связи специально сделан обучающим: он показывает, почему ответ не подходит, не ломая структуру экрана.",
                    "Подсказки должны усиливаться от лёгкого намёка к более сильному напоминанию только после повторных промахов."
                ],
                nudgeTitle: "Сначала посмотрите на состояние рабочего дерева",
                nudgeMessage: "Оставайтесь на команде, которая читает текущее состояние репозитория, прежде чем предлагать очистку или навигацию.",
                strongTitle: "Используйте каноничную команду проверки",
                strongMessage: "Следующее безопасное действие всё ещё строится на каноничной команде проверки для этого сценария. Выберите команду, которая раскрывает состояние и ничего не меняет."
            };
    }
}
