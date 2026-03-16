# Дорожная карта backend

## Цель

Backend должен предоставлять доменную модель и source of truth для учебного опыта по Git. Он отвечает за определения упражнений, жизненный цикл сессий, валидацию ответов, подсказки, объяснения и трекинг прогресса.

Для MVP backend должен позволять отдавать небольшой каталог сценариев, запускать учебную сессию, валидировать ответ пользователя и возвращать достаточно структурированную обратную связь, чтобы frontend мог показать полезное объяснение.

## Правила использования roadmap

- Пункты ниже должны быть пригодны для создания issue.
- Одна задача должна давать завершённый и тестируемый backend-результат.
- Если backend-пункт становится слишком крупным, преврати его в `parent issue` с `sub-issues`.
- Предпочитай такой размер задач, который обычно можно реализовать и отревьюить в одном сфокусированном PR.
- Предпочитай self-contained backend tasks, которые можно делать от базового epic-коммита без зависимости от незамерженного sibling backend-кода.
- Перечисленные sub-issues должны оставаться task-ready: их все нужно иметь возможность создать сразу после initial baseline commit эпика.
- Если нескольким backend sub-issues нужны одни и те же минимальные типы, интерфейсы или fixture schemas, выноси эту seam в initial epic commit, а не в дочернюю задачу.
- Предпочитай делить backend-работу по shell или boundary, policy или domain logic и authored content или fixtures, чтобы sibling tasks могли двигаться параллельно от одного epic baseline.
- Предпочитай начинать epic только с тех backend sub-issues, где уже есть ясные стабильные seams; более мелко дроби позже только если это улучшает параллельность или reviewability.
- Предпочитай backend sub-issues, которые выравниваются с frontend sub-issues по тому же пользовательскому slice, когда обе стороны реализуют одно и то же поведение.
- Backend-only sub-issues допустимы, если они дают завершённую backend capability, contract, набор контента или policy без зависимости от незавершённой sibling-работы.
- Если два backend-шага осмысленны только вместе как один стабильный контракт, объединяй их в одну более широкую backend-задачу вместо цепочки sibling tasks.

## MVP для backend

Backend MVP завершён, когда:

1. backend умеет отдавать каталог Git-упражнений с метаданными и step-content
2. backend умеет создавать и отслеживать пользовательскую сессию для выбранного упражнения
3. backend умеет валидировать отправленные Git-ответы и возвращать structured correctness feedback
4. backend умеет хранить или хотя бы последовательно сообщать результаты попыток и completion status

## Родительские задачи

### Родительская задача 1. Backend просмотра каталога сценариев

Цель: предоставить backend-срез, необходимый для просмотра первого MVP-каталога.

#### Подзадача 1.1. Поставить API shell просмотра каталога и детерминированную stub-границу

Результат: backend публикует endpoint просмотра каталога, маппинг request/response DTO и детерминированный stub adapter, чтобы boundary можно было вызывать до подключения реального контента каталога.

Пара к frontend sub-issue 1.1.

#### Подзадача 1.2. Поставить query policy каталога для фильтрации и сортировки

Результат: backend реализует MVP-логику фильтрации, сортировки и empty-result behavior поверх summary-модели каталога за browse boundary без зависимости от authored scenario set.

Пара к frontend sub-issue 1.2.

#### Подзадача 1.3. Поставить MVP-контент summary каталога и browse-state fixtures

Результат: backend предоставляет начальный набор summary-данных сценариев, а также source fixtures для normal, empty и unavailable-source cases, используя schema seams из epic baseline.

Пара к frontend sub-issue 1.3.

### Родительская задача 2. Backend контекста упражнения и workspace

Цель: предоставить backend-срез, нужный для открытия упражнения и показа его контекста.

#### Подзадача 2.1. Поставить API shell деталей упражнения и stub workspace payload

Результат: backend публикует endpoint деталей упражнения, DTO mapping и детерминированный stub workspace payload, чтобы boundary можно было вызывать до подключения authored detail-контента.

Пара к frontend sub-issue 2.1.

#### Подзадача 2.2. Поставить структуру task-content и правила сборки ordered steps

Результат: backend определяет и собирает learner-facing task-content, включая инструкции, ordered steps, target goal text и статические workspace annotations за моделью деталей упражнения.

Пара к frontend sub-issue 2.2.

#### Подзадача 2.3. Поставить schema контекста репозитория и MVP-контент деталей сценариев

Результат: backend предоставляет модель repository context и authored detail-контент для MVP-упражнений, включая ветки, commit cues, file cues и другие статические repository annotations.

Пара к frontend sub-issue 2.3.

### Родительская задача 3. Backend отправки ответа и проверки корректности

Цель: предоставить backend-срез, необходимый для отправки ответа и первой волны валидации.

#### Подзадача 3.1. Поставить жизненный цикл сессии и transport boundary для отправки ответа

Результат: клиент может стартовать сессию и отправлять ответ через стабильную boundary, покрывающую идентификаторы, lifecycle state и transport-level success/failure handling с детерминированными placeholder outcomes.

Backend-only supporting task для parent issue 3. Frontend transport work связывается через sub-issue 3.3, а correctness rendering — через sub-issue 3.2.

#### Подзадача 3.2. Поставить правила валидации первого answer type и outcome model

Результат: backend оценивает первые MVP answer types и выдаёт стабильную machine-readable outcome model, различающую correct, incorrect, partial при необходимости и unsupported-answer cases.

Пара к frontend sub-issue 3.3.

#### Подзадача 3.3. Поставить failure policy для submissions и mappings unsupported answers

Результат: backend определяет request failure behavior, retryable-versus-terminal submission errors и unsupported-answer mappings, чтобы клиент мог последовательно показывать failure feedback.

Пара к frontend sub-issue 3.2.

### Родительская задача 4. Backend управляемого повтора и подсказок

Цель: предоставить backend-срез, необходимый для обучающих повторных попыток.

#### Подзадача 4.1. Поставить модель retry-state и policy доступности повторов

Результат: backend определяет retry-state model, счётчики повторов и правила eligibility, которые решают, доступна ли ещё одна попытка или более сильная подсказка после неудачной отправки.

Пара к frontend sub-issue 4.1.

#### Подзадача 4.2. Поставить policy выбора объяснений и прогрессивных подсказок

Результат: backend определяет правила выбора учебного объяснения и progression подсказок для incorrect и partial answers в рамках MVP-сценариев.

Пара к frontend sub-issue 4.2.

#### Подзадача 4.3. Поставить сборку retry-feedback payload и boundary mapping

Результат: backend публикует retry-feedback boundary, который после неудачной отправки собирает attempt state, explanation content, hint level и retry eligibility в стабильный payload.

Пара к frontend sub-issue 4.3.

### Родительская задача 5. Backend прогресса и рекомендаций следующего шага

Цель: предоставить backend-срез, необходимый для долговечного трекинга прогресса и последующих рекомендаций.

#### Подзадача 5.1. Поставить модель хранения attempt outcomes и запись completion events

Результат: backend определяет, как записываются outcomes попыток, completion events и in-progress state, чтобы будущие progress queries и рекомендации имели стабильный источник истины.

Backend-only supporting task для parent issue 5. Пользовательская frontend-работа по прогрессу связывается через sub-issues 5.2 и 5.3.

#### Подзадача 5.2. Поставить контракт summary прогресса и правила вывода статусов

Результат: backend публикует progress summary boundary и вычисляет completion markers, in-progress status и recent activity из записанной истории попыток.

Пара к frontend sub-issue 5.2.

#### Подзадача 5.3. Поставить policy рекомендаций следующего шага и payload mapping

Результат: backend определяет, как выводятся решённые, уже начатые и рекомендованные упражнения, и публикует recommendation payload, нужный для follow-up guidance в MVP.

Пара к frontend sub-issue 5.3.
