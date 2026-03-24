package com.example.gittrainer.session.api;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "gittrainer.validator.cli.enabled=true",
        "gittrainer.validator.cli.executable=/bin/echo",
        "spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,org.springframework.boot.jdbc.autoconfigure.DataSourceTransactionManagerAutoConfiguration"
})
@ActiveProfiles("test")
class SessionControllerCliSandboxPolicyTest {

    private final WebApplicationContext webApplicationContext;
    private MockMvc mockMvc;

    SessionControllerCliSandboxPolicyTest(WebApplicationContext webApplicationContext) {
        this.webApplicationContext = webApplicationContext;
    }

    @BeforeEach
    void setUpMockMvc() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext).build();
    }

    @Test
    void returnsRetryableProblemDetailWhenExternalExecutableIsDisallowed() throws Exception {
        String sessionId = startSessionAndExtractId();

        mockMvc.perform(post("/api/sessions/{sessionId}/submissions", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "answerType": "command_text",
                                  "answer": "git status"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.title").value("Проверка сценария временно недоступна"))
                .andExpect(jsonPath("$.code").value("validation-runner-executable-not-allowed"))
                .andExpect(jsonPath("$.retryable").value(true));
    }

    private String startSessionAndExtractId() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "scenarioSlug": "status-basics"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        int startIndex = body.indexOf("\"sessionId\":\"") + "\"sessionId\":\"".length();
        int endIndex = body.indexOf('"', startIndex);
        return body.substring(startIndex, endIndex);
    }
}
