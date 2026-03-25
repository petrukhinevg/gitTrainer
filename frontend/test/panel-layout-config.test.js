import test from "node:test";
import assert from "node:assert/strict";

import { renderPanelLayoutResponsiveStyle } from "../src/workspace-shell/panel-layout-config.js";

test("в двухколоночном overlay-режиме legend тегов сохраняет двухколоночную раскладку", () => {
    const responsiveStyle = renderPanelLayoutResponsiveStyle();

    assert.match(
        responsiveStyle,
        /\.lesson-layout--compact-navigation-overlay \.scenario-legend__row\s*\{[\s\S]*flex-direction:\s*row;/,
        "Во время overlay-режима строки legend должны оставаться горизонтальными"
    );
    assert.match(
        responsiveStyle,
        /\.lesson-layout--compact-navigation-overlay \.scenario-legend__tag\s*\{[\s\S]*flex:\s*1 1 0;/,
        "Во время overlay-режима теги должны сохранять равномерную ширину"
    );
});
