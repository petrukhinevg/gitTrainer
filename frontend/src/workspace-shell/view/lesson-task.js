export function normalizeTaskInstructions(detail) {
    return (detail.workspace.task.instructions ?? []).map((instruction, index) => {
        if (typeof instruction === "string") {
            return {
                id: `instruction-${index + 1}`,
                text: instruction
            };
        }

        return {
            id: instruction.id ?? `instruction-${index + 1}`,
            text: instruction.text ?? ""
        };
    });
}

export function normalizeTaskSteps(detail) {
    return (detail.workspace.task.steps ?? [])
        .map((step, index) => {
            if (typeof step === "string") {
                return {
                    position: index + 1,
                    title: `Шаг ${index + 1}`,
                    detail: step
                };
            }

            return {
                position: step.position ?? index + 1,
                title: step.title ?? `Шаг ${index + 1}`,
                detail: step.detail ?? ""
            };
        })
        .sort((left, right) => left.position - right.position);
}

export function normalizeTaskAnnotations(detail) {
    return (detail.workspace.task.annotations ?? []).map((annotation, index) => {
        if (typeof annotation === "string") {
            return {
                label: `Заметка ${index + 1}`,
                message: annotation
            };
        }

        return {
            label: annotation.label ?? `Заметка ${index + 1}`,
            message: annotation.message ?? ""
        };
    });
}

export function buildLessonNavigationItems(detail) {
    const instructions = normalizeTaskInstructions(detail);
    const steps = normalizeTaskSteps(detail);

    return [
        {
            state: "current",
            eyebrow: "Сейчас",
            title: "Вводная",
            detail: detail.workspace.task.goal
        },
        {
            state: "ready",
            eyebrow: "Дальше",
            title: "Поток инструкций",
            detail: `${instructions.length} ${instructions.length === 1 ? "ориентир" : "ориентира"}`
        },
        ...steps.map((step, index) => ({
            state: index === 0 ? "upcoming" : "queued",
            eyebrow: `Шаг ${step.position}`,
            title: step.title,
            detail: step.detail
        })),
        {
            state: "locked",
            eyebrow: "Позже",
            title: "Практика",
            detail: "Ввод ответа и обратная связь по выполнению остаются в правой колонке практики."
        }
    ];
}
