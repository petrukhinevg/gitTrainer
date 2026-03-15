package com.example.gittrainer.scenario.api;

import com.example.gittrainer.scenario.application.ListScenarioCatalogUseCase;
import com.example.gittrainer.scenario.infrastructure.InMemoryScenarioCatalog;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ScenarioCatalogControllerTest {

    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(
            new ScenarioCatalogController(
                    new ListScenarioCatalogUseCase(new InMemoryScenarioCatalog())
            )
    ).build();

    @Test
    void listsStatusAndBranchBasicsCatalogSummaries() throws Exception {
        mockMvc.perform(get("/api/scenarios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(7)))
                .andExpect(jsonPath("$.items[0].id").value("status-clean-working-tree"))
                .andExpect(jsonPath("$.items[0].topic").value("STATUS"))
                .andExpect(jsonPath("$.items[0].difficulty").value("BEGINNER"))
                .andExpect(jsonPath("$.items[0].catalogOrder").value(10))
                .andExpect(jsonPath("$.items[0].estimatedMinutes").value(5))
                .andExpect(jsonPath("$.items[1].id").value("status-untracked-file"))
                .andExpect(jsonPath("$.items[2].id").value("branch-create-feature"))
                .andExpect(jsonPath("$.items[3].id").value("branch-switch-feature"));
    }

    @Test
    void includesHistoryRebaseAndConflictStarterScenarios() throws Exception {
        mockMvc.perform(get("/api/scenarios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", hasItems(
                        "history-inspect-recent-commits",
                        "rebase-linearize-feature-branch",
                        "conflict-resolve-simple-merge"
                )));
    }
}
