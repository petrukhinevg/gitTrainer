import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { renderSidebarPanelContent } from "../src/workspace-shell/view/sidebar-panel.js";
import {
    bindNavigationActiveMarker,
    redrawNavigationActiveMarker,
    resolveNavigationActiveMarkerTarget
} from "../src/workspace-shell/navigation-active-marker.js";

test("навигационная панель рендерит rail для активного маркера", () => {
    const markup = renderSidebarPanelContent(createReadyState(), null, ["branching", "navigation"]);
    const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`);

    try {
        const document = dom.window.document;
        assert.ok(document.querySelector(".navigation-flow-rail"));
        assert.ok(document.querySelector("[data-navigation-active-marker]"));
    } finally {
        dom.window.close();
    }
});

test("маркер выбирает активную подзадачу приоритетнее активного сценария и обновляет позицию", () => {
    const dom = new JSDOM(createMarkerFixture(), { pretendToBeVisual: true });
    const { window } = dom;
    const restoreGlobals = installNavigationMarkerGlobals(window);

    try {
        const appRoot = window.document.querySelector("[data-app-root]");
        const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
        const marker = appRoot.querySelector("[data-navigation-active-marker]");
        const scenarioToggle = appRoot.querySelector("[data-scenario-toggle]");
        const subtaskLink = appRoot.querySelector("[data-scenario-focus]");

        assignRect(mapRoot, createRect(0, 40, 280, 520));
        assignRect(scenarioToggle, createRect(24, 120, 220, 52));
        assignRect(subtaskLink, createRect(40, 236, 204, 46));

        bindNavigationActiveMarker({ appRoot });
        flushRafQueue(window);

        assert.equal(resolveNavigationActiveMarkerTarget(mapRoot), subtaskLink);
        assert.equal(marker.dataset.visible, "true");
        assert.equal(marker.style.getPropertyValue("--navigation-active-marker-y"), "219px");

        subtaskLink.classList.remove("flow-block--active");
        redrawNavigationActiveMarker(appRoot, { instant: true });
        flushRafQueue(window);

        assert.equal(resolveNavigationActiveMarkerTarget(mapRoot), scenarioToggle);
        assert.equal(marker.style.getPropertyValue("--navigation-active-marker-y"), "106px");
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

function createReadyState() {
    return {
        route: "exercise",
        providerName: "backend-api",
        catalog: {
            status: "ready",
            items: [
                {
                    slug: "branch-safety",
                    title: "Подтверди текущую ветку",
                    tags: ["branching", "navigation"]
                }
            ]
        },
        expandedScenarioSlugs: ["branch-safety"],
        expandingScenarioSlug: null,
        selectedScenarioSlug: "branch-safety",
        selectedFocus: "step-1",
        pinnedNavigationTag: null,
        detail: {
            status: "ready",
            scenarioSlug: "branch-safety",
            error: null,
            data: {
                workspace: {
                    task: {
                        steps: [
                            {
                                position: 1,
                                title: "Проверь ветку"
                            }
                        ]
                    }
                }
            }
        },
        detailCache: {
            "branch-safety": {
                status: "ready",
                error: null,
                data: {
                    workspace: {
                        task: {
                            steps: [
                                {
                                    position: 1,
                                    title: "Проверь ветку"
                                }
                            ]
                        }
                    }
                }
            }
        }
    };
}

function createMarkerFixture() {
    return `
        <!doctype html>
        <html>
            <body>
                <div data-app-root>
                    <section class="lesson-layout lesson-layout--exercise">
                        <section class="lesson-lane lesson-lane--navigation">
                            <div class="lesson-lane__body">
                                <div class="lesson-lane__scroll-content">
                                    <div class="tag-connection-map" data-tag-connection-map>
                                        <div class="navigation-flow-rail" aria-hidden="true">
                                            <span class="navigation-flow-rail__line"></span>
                                            <span class="navigation-flow-rail__marker" data-navigation-active-marker></span>
                                        </div>
                                        <div class="flow-block-list" data-flow-block-list>
                                            <section class="flow-node">
                                                <button
                                                    class="flow-block flow-block--toggle flow-block--active"
                                                    type="button"
                                                    data-scenario-toggle="branch-safety"
                                                >
                                                    <strong class="flow-block__title">Сценарий</strong>
                                                </button>
                                                <div class="flow-subtask-region" data-scenario-panel="branch-safety">
                                                    <div class="flow-subtask-group">
                                                        <a
                                                            class="flow-block flow-block--subtask flow-block--active"
                                                            href="#/exercise/branch-safety?focus=step-1"
                                                            data-scenario-focus="step-1"
                                                        >
                                                            <strong class="flow-block__title">Подзадача</strong>
                                                        </a>
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </section>
                </div>
            </body>
        </html>
    `;
}

function installNavigationMarkerGlobals(window) {
    const previousWindow = global.window;
    const previousDocument = global.document;
    const previousHTMLElement = global.HTMLElement;
    const previousRequestAnimationFrame = global.requestAnimationFrame;
    const previousCancelAnimationFrame = global.cancelAnimationFrame;
    const rafQueue = [];
    let nextRafId = 0;

    global.window = window;
    global.document = window.document;
    global.HTMLElement = window.HTMLElement;
    global.requestAnimationFrame = (callback) => {
        const id = ++nextRafId;
        rafQueue.push({ id, callback });
        return id;
    };
    global.cancelAnimationFrame = (id) => {
        const entryIndex = rafQueue.findIndex((entry) => entry.id === id);
        if (entryIndex >= 0) {
            rafQueue.splice(entryIndex, 1);
        }
    };
    window.requestAnimationFrame = global.requestAnimationFrame;
    window.cancelAnimationFrame = global.cancelAnimationFrame;
    window.__testNavigationMarkerRafQueue = rafQueue;

    return () => {
        global.window = previousWindow;
        global.document = previousDocument;
        global.HTMLElement = previousHTMLElement;
        global.requestAnimationFrame = previousRequestAnimationFrame;
        global.cancelAnimationFrame = previousCancelAnimationFrame;
    };
}

function flushRafQueue(window) {
    const rafQueue = window.__testNavigationMarkerRafQueue ?? [];

    while (rafQueue.length > 0) {
        const { callback } = rafQueue.shift();
        callback();
    }
}

function createRect(left, top, width, height) {
    return {
        x: left,
        y: top,
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height
    };
}

function assignRect(element, rect) {
    Object.defineProperty(element, "getBoundingClientRect", {
        configurable: true,
        value: () => rect
    });
}
