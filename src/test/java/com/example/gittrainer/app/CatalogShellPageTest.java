package com.example.gittrainer.app;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class CatalogShellPageTest {

    private final WebApplicationContext webApplicationContext;
    private MockMvc mockMvc;

    CatalogShellPageTest(WebApplicationContext webApplicationContext) {
        this.webApplicationContext = webApplicationContext;
    }

    @BeforeEach
    void setUpMockMvc() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext).build();
    }

    @Test
    void servesCatalogShellFromRoot() throws Exception {
        Assumptions.assumeTrue(
                webApplicationContext.getResource("classpath:static/index.html").exists(),
                "Frontend static assets are not present on the test classpath."
        );

        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("index.html"));

        mockMvc.perform(get("/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Practice Git by reading the repo before you touch it.")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("/app.js")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Scenario catalog route shell and browse-state controls are already live.")));

        mockMvc.perform(get("/app.js"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Navigation lane")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Scenario map")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Lesson navigation rail")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Mission brief")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Practice lane")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Task list")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Welcome task")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Exercise route is loading provider-backed detail")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Instruction flow")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Ordered steps")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Static workspace annotations")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Practice input and Git context stay visible together")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Prepare payload")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Git context viewer")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("renderLessonLayout")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("renderLessonLane")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("normalizeTaskInstructions")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("normalizeTaskSteps")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("buildLessonNavigationItems")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Practice scaffolding stays mounted while detail loads")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Scenario detail provider seam failed")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Keep the input surface separate from the Git context viewer")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("practice-context__tab")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("[data-practice-context-tab]")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("[data-practice-draft-form]")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("No branch cues are available from the active detail payload.")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("No workspace annotations are available from the active detail payload.")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("context-row__header")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Route handoff now resolves detail through a dedicated provider seam.")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Open scenario")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("#/exercise/")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Back to catalog")));

        mockMvc.perform(get("/app.css"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".page-shell")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".lesson-layout")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".lesson-lane--practice")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".lesson-lane__meta-chip")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".lesson-nav__item")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".lane-switcher__button--active")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".lesson-spotlight")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".task-sequence")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".task-annotation")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".app-shell--exercise .lesson-layout")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".practice-composer__notice--ready")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".practice-context__tab--active")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".context-list")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".context-pill--active")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("@media (max-width: 720px)")));
    }
}
