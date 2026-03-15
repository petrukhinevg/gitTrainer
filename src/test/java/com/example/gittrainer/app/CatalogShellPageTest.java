package com.example.gittrainer.app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assumptions;
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
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Scenario map")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Lesson navigation rail")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Mission brief")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Practice lane")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Exercise route is loading provider-backed detail")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Instruction flow")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Ordered steps")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Static workspace annotations")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("focused lesson surface still reads directly from the existing workspace payload")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("normalizeTaskInstructions")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("normalizeTaskSteps")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("buildLessonNavigationItems")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Selected scenario detail is loading")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Scenario detail provider seam failed")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Repository context now has visible workspace surfaces")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Recent commits")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("File cues")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Workspace annotations")))
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
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".workspace-grid")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".panel--workspace")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".lesson-nav__item")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".lesson-spotlight")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".task-sequence")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".task-annotation")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".context-list")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".context-pill--active")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("@media (max-width: 720px)")));
    }
}
