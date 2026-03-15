package com.example.gittrainer.app;

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
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Exercise route is loading provider-backed detail")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Instruction flow")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Ordered steps")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Static workspace annotations")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Task presentation now uses the workspace payload directly")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("resolveTaskInstructions")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("resolveTaskSteps")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Selected scenario detail is loading")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Scenario detail provider seam failed")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Route handoff now resolves detail through a dedicated provider seam.")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Open scenario")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("#/exercise/")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Back to catalog")));

        mockMvc.perform(get("/app.css"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".page-shell")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".workspace-grid")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".panel--workspace")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".task-sequence")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(".task-annotation")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("@media (max-width: 720px)")));
    }
}
