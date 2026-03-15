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
                    title: `Step ${index + 1}`,
                    detail: step
                };
            }

            return {
                position: step.position ?? index + 1,
                title: step.title ?? `Step ${index + 1}`,
                detail: step.detail ?? ""
            };
        })
        .sort((left, right) => left.position - right.position);
}

export function normalizeTaskAnnotations(detail) {
    return (detail.workspace.task.annotations ?? []).map((annotation, index) => {
        if (typeof annotation === "string") {
            return {
                label: `Note ${index + 1}`,
                message: annotation
            };
        }

        return {
            label: annotation.label ?? `Note ${index + 1}`,
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
            eyebrow: "Now",
            title: "Mission brief",
            detail: detail.workspace.task.goal
        },
        {
            state: "ready",
            eyebrow: "Read next",
            title: "Instruction flow",
            detail: `${instructions.length} guidance point${instructions.length === 1 ? "" : "s"}`
        },
        ...steps.map((step, index) => ({
            state: index === 0 ? "upcoming" : "queued",
            eyebrow: `Step ${step.position}`,
            title: step.title,
            detail: step.detail
        })),
        {
            state: "locked",
            eyebrow: "Later",
            title: "Practice lane",
            detail: "Answer entry and execution feedback stay reserved for the follow-up practice task."
        }
    ];
}
