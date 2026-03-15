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
                .andExpect(content().string(org.hamcrest.Matchers.containsString("id=\"app\"")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Loading workspace...")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("/app.js")));

        mockMvc.perform(get("/app.js"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Navigation lane")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Scenario map")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Training flow")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Practice lane")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Start here")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Sub-task")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Choose a task block from the left lane")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("How to use this screen")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Instruction flow")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Ordered steps")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Practice input and Git context stay visible together")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Prepare payload")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Git context viewer")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("renderLessonLayout")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("renderLessonLane")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("normalizeTaskInstructions")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("normalizeTaskSteps")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Practice scaffolding stays mounted while detail loads")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Scenario detail provider seam failed")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Keep the input surface separate from the Git context viewer")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("practice-context__tab")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("[data-practice-context-tab]")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("[data-practice-draft-form]")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("No branch cues are available from the active detail payload.")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("No workspace annotations are available from the active detail payload.")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("context-row__header")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("#/exercise/")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Back to welcome")));

        mockMvc.perform(get("/app.css"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".page-shell")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("overflow-y: auto")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".lesson-layout__lane + .lesson-layout__lane")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".lesson-layout")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".lesson-lane--practice")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".lesson-lane__meta-chip")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".flow-block")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".flow-block--subtask")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".lesson-spotlight")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".task-sequence")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".task-annotation")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".practice-composer__notice--ready")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".practice-context__tab--active")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".context-list")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".context-pill--active")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("@media (max-width: 720px)")));
    }
}
