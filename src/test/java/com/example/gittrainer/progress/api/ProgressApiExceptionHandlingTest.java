package com.example.gittrainer.progress.api;

import com.example.gittrainer.GitTrainerApplication;
import com.example.gittrainer.scenario.application.ScenarioCatalogGateway;
import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import com.example.gittrainer.scenario.infrastructure.ScenarioCatalogSourceUnavailableException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = {
        GitTrainerApplication.class,
        ProgressApiExceptionHandlingTest.UnavailableScenarioCatalogGatewayConfig.class
})
class ProgressApiExceptionHandlingTest {

    private final WebApplicationContext webApplicationContext;
    private MockMvc mockMvc;

    ProgressApiExceptionHandlingTest(WebApplicationContext webApplicationContext) {
        this.webApplicationContext = webApplicationContext;
    }

    @BeforeEach
    void setUpMockMvc() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext).build();
    }

    @Test
    void returnsSharedProblemDetailWhenScenarioSourceFailsInsideProgressFlow() throws Exception {
        mockMvc.perform(get("/api/progress").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.title").value("Источник сценариев недоступен"))
                .andExpect(jsonPath("$.detail").value("Источник каталога сейчас недоступен. Выберите другой источник или повторите позже."))
                .andExpect(jsonPath("$.code").value("scenario-source-unavailable"))
                .andExpect(jsonPath("$.failureDisposition").value("retryable"))
                .andExpect(jsonPath("$.retryable").value(true))
                .andExpect(jsonPath("$.sourceName").value("mvp-fixture-unavailable"));
    }

    @TestConfiguration
    static class UnavailableScenarioCatalogGatewayConfig {

        @Bean
        @Primary
        ScenarioCatalogGateway unavailableScenarioCatalogGateway() {
            return new ScenarioCatalogGateway() {
                @Override
                public List<ScenarioSummary> loadCatalog(CatalogBrowseQuery query) {
                    throw new ScenarioCatalogSourceUnavailableException(
                            "mvp-fixture-unavailable",
                            "Источник каталога сейчас недоступен. Выберите другой источник или повторите позже."
                    );
                }

                @Override
                public String sourceName(CatalogBrowseQuery query) {
                    return "mvp-fixture-unavailable";
                }
            };
        }
    }
}
