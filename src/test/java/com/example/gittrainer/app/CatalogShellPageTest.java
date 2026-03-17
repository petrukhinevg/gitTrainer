package com.example.gittrainer.app;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
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
                .andExpect(content().string(org.hamcrest.Matchers.containsString("class=\"page-shell\"")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("id=\"app\"")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("aria-live=\"polite\"")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("/app.js")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("/app.css")));

        assertAssetContains(
                "/app.js",
                "#/catalog",
                "#/exercise/",
                "[data-scenario-toggle]",
                "[data-catalog-controls-form]",
                "data-reset-catalog-controls",
                "name=\"providerName\"",
                "name=\"difficulty\"",
                "name=\"sort\"",
                "name=\"tags\"",
                "[data-submission-draft-form]",
                "data-retry-feedback-panel",
                "data-retry-context-summary",
                "data-retry-feedback-slot",
                "data-retry-explanation",
                "data-retry-feedback-status",
                "data-retry-state-status",
                "data-retry-eligibility",
                "data-retry-hint-level",
                "data-retry-hint-reveal",
                "data-session-request-retry",
                "app-shell--exercise",
                "Try again in a moment."
        );

        mockMvc.perform(get("/app.js"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("swap providers to repopulate the scenario map"))))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Try another provider."))));

        assertAssetContains(
                "/app.css",
                ".page-shell",
                ".app-shell",
                ".lesson-layout",
                ".lesson-layout__lane--navigation",
                ".lesson-layout__lane--lesson",
                ".lesson-layout__lane--practice",
                ".catalog-controls__form",
                ".catalog-controls__grid",
                ".catalog-controls__tag-list",
                ".practice-stack",
                ".branch-graph"
        );
    }

    private void assertAssetContains(String path, String... markers) throws Exception {
        MvcResult result = mockMvc.perform(get(path))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        Assertions.assertFalse(body.isBlank(), "Expected %s to be non-empty".formatted(path));
        for (String marker : markers) {
            assertThat(body)
                    .as("Expected %s to contain stable shell marker `%s`", path, marker)
                    .contains(marker);
        }
    }
}
