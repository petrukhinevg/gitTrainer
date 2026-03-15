package com.example.gittrainer.scenario.api;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class ScenarioCatalogControllerTest {

    private final WebApplicationContext webApplicationContext;
    private MockMvc mockMvc;

    ScenarioCatalogControllerTest(WebApplicationContext webApplicationContext) {
        this.webApplicationContext = webApplicationContext;
    }

    @BeforeEach
    void setUpMockMvc() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext).build();
    }

    @Test
    void returnsDeterministicStubCatalogBoundary() throws Exception {
        mockMvc.perform(get("/api/scenarios")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.meta.source").value("stub"))
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.items[0].id").value("branch-safety"))
                .andExpect(jsonPath("$.items[0].difficulty").value("beginner"))
                .andExpect(jsonPath("$.items[1].slug").value("history-cleanup-preview"))
                .andExpect(jsonPath("$.items[1].tags[1]").value("cleanup"));
    }

    @Test
    void echoesCatalogQueryShapeWhileApplyingFilteringAndSortingPolicy() throws Exception {
        mockMvc.perform(get("/api/scenarios")
                        .param("difficulty", "BEGINNER")
                        .param("sort", "difficulty")
                        .param("tag", "status")
                        .param("tag", "basics")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.query.difficulty").value("BEGINNER"))
                .andExpect(jsonPath("$.meta.query.sort").value("difficulty"))
                .andExpect(jsonPath("$.meta.query.tags[0]").value("status"))
                .andExpect(jsonPath("$.meta.query.tags[1]").value("basics"))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value("status-basics"));
    }

    @Test
    void omitsTagsFromQueryMetaWhenTagFilterWasNotProvided() throws Exception {
        mockMvc.perform(get("/api/scenarios")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.query.difficulty").doesNotExist())
                .andExpect(jsonPath("$.meta.query.sort").doesNotExist())
                .andExpect(jsonPath("$.meta.query.tags").doesNotExist());
    }

    @Test
    void filtersCatalogByDifficultyIgnoringCase() throws Exception {
        mockMvc.perform(get("/api/scenarios")
                        .param("difficulty", "beginner")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].id").value("branch-safety"))
                .andExpect(jsonPath("$.items[1].id").value("status-basics"));
    }

    @Test
    void sortsCatalogByDifficultyThenTitleWhenRequested() throws Exception {
        mockMvc.perform(get("/api/scenarios")
                        .param("sort", "difficulty")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.items[0].id").value("branch-safety"))
                .andExpect(jsonPath("$.items[1].id").value("status-basics"))
                .andExpect(jsonPath("$.items[2].id").value("history-cleanup-preview"));
    }

    @Test
    void returnsEmptyItemsWhenFiltersExcludeEverything() throws Exception {
        mockMvc.perform(get("/api/scenarios")
                        .param("difficulty", "intermediate")
                        .param("tag", "basics")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0))
                .andExpect(jsonPath("$.meta.query.difficulty").value("intermediate"))
                .andExpect(jsonPath("$.meta.query.tags[0]").value("basics"));
    }
}
