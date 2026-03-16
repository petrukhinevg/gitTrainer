# Дорожная карта frontend

## Цель

Frontend должен предоставить сфокусированный single-page learning experience, в котором пользователь проходит путь от выбора сценария до решения Git-задачи без перезагрузок страницы и потери контекста. Он должен делать состояние репозитория, ожидаемую цель задачи, текущий ответ и feedback удобными для сравнения на одном экране.

Для MVP frontend должен позволять просматривать упражнения, входить в учебную сессию, отправлять ответ и понимать результат через ясную обратную связь и индикаторы прогресса.

## Правила использования roadmap

- Пункты ниже должны быть пригодны для создания issue.
- Одна задача должна давать завершённый и тестируемый frontend-результат.
- Если frontend-пункт становится слишком крупным, преврати его в `parent issue` с `sub-issues`.
- Предпочитай такой размер задач, который обычно можно реализовать и отревьюить в одном сфокусированном PR.
- Предпочитай self-contained frontend tasks, которые могут двигаться от fixtures или стабильных контрактов без ожидания незамерженного sibling frontend-кода.
- Перечисленные sub-issues должны оставаться task-ready: их все нужно иметь возможность создать сразу после initial baseline commit эпика.
- Если нескольким frontend sub-issues нужны одни и те же минимальные route placeholders, provider interfaces, props shapes или fixture schemas, выноси эту seam в initial epic commit, а не в child task.
- Предпочитай делить frontend-работу по shell или screen state, presentation surfaces и provider или transport integration, чтобы sibling tasks могли двигаться параллельно от одного epic baseline.
- Предпочитай начинать epic только с тех frontend sub-issues, где уже есть ясные UI или state seams; детализируй дальше только когда это улучшает параллельность или reviewability.
- Предпочитай frontend sub-issues, синхронизированные с backend sub-issues для того же пользовательского slice, когда обе стороны реализуют одно и то же поведение.
- Frontend-only sub-issues допустимы, если они дают завершённое UI state, presentation surface или interaction loop поверх стабильной или заменяемой provider seam.
- Если несколько frontend-шагов осмысленны только вместе как один экран или один interaction loop, держи их в одной более широкой frontend-задаче вместо цепочки sibling tasks.

## Базовые UI-ограничения

- тип приложения: SPA
- основная рабочая поверхность: учебный workspace с панелью сценария, зоной ввода ответа и панелью feedback по валидации
- responsive targets: desktop-first, пригодно на планшете, базовая поддержка мобильных экранов для чтения и лёгкого взаимодействия
- визуальные и accessibility constraints: keyboard-friendly input flow, high-contrast status states, отсутствие feedback, передаваемого только цветом, и читаемая типографика Git-команд

## MVP для frontend

Frontend MVP завершён, когда:

1. пользователь может просматривать и фильтровать каталог Git-упражнений в одном SPA-потоке
2. пользователь может открыть упражнение и увидеть описание задачи, контекст репозитория и контролы ввода ответа
3. пользователь может отправить ответ и получить понятную feedback-визуализацию без ухода со страницы
4. пользователь может видеть, какие упражнения завершены и что практиковать дальше

## Родительские задачи

### Родительская задача 1. Frontend просмотра каталога сценариев

Цель: предоставить frontend-срез, необходимый для просмотра и выбора упражнений.

#### Подзадача 1.1. Поставить shell маршрута каталога и заменяемую provider seam

Результат: frontend предоставляет shell маршрута каталога, boundary экранного состояния и заменяемую provider seam с локальными fixtures, чтобы работа по каталогу могла идти без ожидания live backend integration.

Пара к backend sub-issue 1.1.

#### Подзадача 1.2. Поставить query controls каталога и обработку browse-состояний

Результат: frontend обрабатывает initial load, filtering, sorting, empty results, loading и unavailable-source states через экранную модель состояния каталога без зависимости от финальных деталей рендера списка.

Пара к backend sub-issue 1.2.

#### Подзадача 1.3. Поставить рендер списка каталога и presentation entry-actions

Результат: frontend рендерит карточки или строки summary сценариев, теги, индикаторы сложности и entry actions поверх catalog provider seam без изменения screen-state contract.

Пара к backend sub-issue 1.3.

### Родительская задача 2. Frontend контекста упражнения и workspace

Цель: предоставить frontend-срез, необходимый для открытия упражнения и понимания его контекста.

#### Подзадача 2.1. Поставить exercise route, workspace shell и заменяемую detail provider seam

Результат: frontend подключает routing упражнения, flow загрузки и ошибок, а также заменяемую detail provider seam с локальными fixtures, поставляя стабильный workspace shell ещё до завершения финального рендера контента.

Пара к backend sub-issue 2.1.

#### Подзадача 2.2. Поставить presentation инструкций задачи и ordered steps

Результат: frontend рендерит goal text, инструкции, ordered steps и статические workspace annotations из payload workspace без зависимости от визуализации контекста репозитория.

Пара к backend sub-issue 2.2.

#### Подзадача 2.3. Поставить presentation surfaces для контекста репозитория

Результат: frontend рендерит cues контекста репозитория, такие как ветки, коммиты, файлы и annotations, используя workspace payload без переработки shell.

Пара к backend sub-issue 2.3.

#### Подзадача 2.4. Рефакторинг workspace shell в стабильный трёхколоночный lesson layout

Результат: frontend перестраивает экран упражнения в desktop-first трёхколоночный layout с выделенными полосами left navigation, center lesson и right practice, сохраняя существующие route и provider boundaries.

Frontend-only follow-up task для parent issue 2 после того, как initial workspace shell и surfaces контекста репозитория уже есть.

#### Подзадача 2.5. Поставить rail навигации по lesson и сфокусированное представление central lesson

Результат: frontend превращает левую колонку в навигатор по level или lesson и фокусирует центральную колонку на активном описании задачи, чтобы пользователь мог быстро считывать progression и инструкции без конкуренции со стороны practice lane.

Frontend-only follow-up task для parent issue 2, которая строится на уже существующих seams workspace payload и shell.

### Родительская задача 3. Frontend отправки ответа и проверки корректности

Цель: предоставить frontend-срез, необходимый для отправки ответа и первой волны feedback по корректности.

#### Подзадача 3.1. Поставить shell ввода ответа и локальный flow draft-state

Результат: frontend поставляет контролы ввода ответа, локальное draft state и поведение формы, готовой к отправке, без зависимости от live transport или финального correctness rendering.

Frontend-only supporting task для parent issue 3. Парность с backend начинается с transport и correctness slices в sub-issues 3.2 и 3.3.

#### Подзадача 3.2. Поставить интеграцию transport submission и обработку request-state

Результат: frontend интегрирует bootstrap сессии и отправку ответа через заменяемый provider, включая pending, retryable request failure и terminal request failure states.

Пара к backend sub-issue 3.3.

#### Подзадача 3.3. Поставить рендер feedback по корректности и unsupported answers

Результат: frontend рендерит machine-readable correctness outcomes для первых MVP answer types, включая correct, incorrect и unsupported-answer cases, не меняя shell ввода ответа.

Пара к backend sub-issue 3.2.

#### Подзадача 3.4. Рефакторинг правой колонки workspace в practice surface с input и branch-state output

Результат: frontend превращает правую колонку в practice-focused surface, объединяющую ввод ответа с видимым состоянием Git-веток или scaffolding вывода выполнения, не требуя завершённого validation loop.

Frontend-only follow-up task для parent issue 3, которая расширяет shell ввода ответа до целевого practice layout.

### Родительская задача 4. Frontend управляемого повтора и подсказок

Цель: предоставить frontend-срез, необходимый для обучающих повторных попыток.

#### Подзадача 4.1. Поставить shell панели feedback и сохранение exercise-context state

Результат: frontend предоставляет shell панели feedback и сохраняет контекст активного упражнения после неудачных submissions без зависимости от финальных деталей explanations или transport.

Пара к backend sub-issue 4.1.

#### Подзадача 4.2. Поставить рендер explanations и progressive hint interactions

Результат: frontend рендерит обучающие explanations, сообщения о partial match и прогрессивное раскрытие hints из payload props без изменения shell панели feedback.

Пара к backend sub-issue 4.2.

#### Подзадача 4.3. Поставить интеграцию retry boundary и переходы retry-state

Результат: frontend подключает retry feedback boundary, обрабатывает переходы retry-state и синхронизирует hint level или retry eligibility с уже существующей панелью feedback.

Пара к backend sub-issue 4.3.

### Родительская задача 5. Frontend прогресса и рекомендаций следующего шага

Цель: предоставить frontend-срез, необходимый для видимого прогресса и осмысленных follow-up рекомендаций.

#### Подзадача 5.1. Поставить shell surface прогресса и компоненты status markers

Результат: frontend поставляет surfaces прогресса, completion markers, индикаторы in-progress и состояния компонентов recent activity поверх локальных props или fixture-данных без зависимости от финальной provider integration.

Frontend-only supporting task для parent issue 5. Парность с backend начинается с summary и recommendation slices в sub-issues 5.2 и 5.3.

#### Подзадача 5.2. Поставить интеграцию summary прогресса и обработку activity-state

Результат: frontend потребляет boundary summary прогресса через заменяемую provider seam и обрабатывает loading, empty и unavailable progress states без переработки progress surface.

Пара к backend sub-issue 5.2.

#### Подзадача 5.3. Поставить presentation рекомендаций и UX следующего шага

Результат: frontend показывает рекомендации следующего шага, различение solved-versus-next и follow-up guidance actions, используя recommendation payload без переработки progress surface.

Пара к backend sub-issue 5.3.
