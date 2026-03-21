package com.example.gittrainer.scenario.api;

import com.example.gittrainer.GitTrainerApplication;
import com.example.gittrainer.scenario.application.ScenarioTaskContent;
import com.example.gittrainer.scenario.application.ScenarioTaskContentGateway;
import com.example.gittrainer.scenario.application.ScenarioTaskContentNotAuthoredException;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = {
        GitTrainerApplication.class,
        ScenarioApiExceptionHandlingTest.FailingTaskContentGatewayConfig.class
})
class ScenarioApiExceptionHandlingTest {

    private final WebApplicationContext webApplicationContext;
    private MockMvc mockMvc;

    ScenarioApiExceptionHandlingTest(WebApplicationContext webApplicationContext) {
        this.webApplicationContext = webApplicationContext;
    }

    @BeforeEach
    void setUpMockMvc() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext).build();
    }

    @Test
    void returnsSharedProblemDetailWhenTaskContentIsNotAuthored() throws Exception {
        mockMvc.perform(get("/api/scenarios/status-basics").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.title").value("Контент сценария не подготовлен"))
                .andExpect(jsonPath("$.detail").value("Описание задания не подготовлено для сценария: status-basics"))
                .andExpect(jsonPath("$.code").value("scenario-task-content-not-authored"))
                .andExpect(jsonPath("$.failureDisposition").value("terminal"))
                .andExpect(jsonPath("$.retryable").value(false));
    }

    @TestConfiguration
    static class FailingTaskContentGatewayConfig {

        @Bean
        @Primary
        ScenarioTaskContentGateway failingScenarioTaskContentGateway() {
            return new ScenarioTaskContentGateway() {
                @Override
                public ScenarioTaskContent loadTaskContent(String scenarioSlug) {
                    throw new ScenarioTaskContentNotAuthoredException(scenarioSlug);
                }
            };
        }
    }
}
