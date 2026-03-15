package com.example.gittrainer.session.api;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class TrainingSessionControllerTest {

    private static final Pattern SESSION_ID_PATTERN = Pattern.compile("\"sessionId\"\\s*:\\s*\"([^\"]+)\"");

    private final WebApplicationContext webApplicationContext;
    private MockMvc mockMvc;

    TrainingSessionControllerTest(WebApplicationContext webApplicationContext) {
        this.webApplicationContext = webApplicationContext;
    }

    @BeforeEach
    void setUpMockMvc() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext).build();
    }

    @Test
    void startsTrainingSessionAndReturnsTransportBoundary() throws Exception {
        mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "scenarioSlug": "branch-safety"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.sessionId", startsWith("session-")))
                .andExpect(jsonPath("$.scenarioSlug").value("branch-safety"))
                .andExpect(jsonPath("$.state").value("active"))
                .andExpect(jsonPath("$.transport.submitAnswerUrl", startsWith("/api/sessions/session-")))
                .andExpect(jsonPath("$.transport.placeholderOutcomeCode").value("validation-pending"));
    }

    @Test
    void submitsAnswerAgainstStartedSessionAndReturnsDeterministicPlaceholderOutcome() throws Exception {
        String sessionId = startSession("branch-safety");

        mockMvc.perform(post("/api/sessions/{sessionId}/submissions", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "answer": "git status"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.submissionId", startsWith("submission-")))
                .andExpect(jsonPath("$.sessionId").value(sessionId))
                .andExpect(jsonPath("$.scenarioSlug").value("branch-safety"))
                .andExpect(jsonPath("$.attemptNumber").value(1))
                .andExpect(jsonPath("$.state").value("submission-received"))
                .andExpect(jsonPath("$.outcome.type").value("placeholder"))
                .andExpect(jsonPath("$.outcome.code").value("command-text-received"));
    }

    @Test
    void rejectsBlankScenarioSlugWhenStartingSession() throws Exception {
        mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "scenarioSlug": "   "
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Scenario slug must not be blank."));
    }

    @Test
    void rejectsBlankAnswerWhenSubmitting() throws Exception {
        String sessionId = startSession("branch-safety");

        mockMvc.perform(post("/api/sessions/{sessionId}/submissions", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "answer": "   "
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Answer must not be blank."));
    }

    @Test
    void returnsNotFoundWhenSubmittingAgainstUnknownSession() throws Exception {
        mockMvc.perform(post("/api/sessions/{sessionId}/submissions", "session-999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "answer": "git status"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Training session 'session-999' was not found."));
    }

    private String startSession(String scenarioSlug) throws Exception {
        MvcResult mvcResult = mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "scenarioSlug": "%s"
                                }
                                """.formatted(scenarioSlug))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andReturn();

        Matcher matcher = SESSION_ID_PATTERN.matcher(mvcResult.getResponse().getContentAsString());
        if (!matcher.find()) {
            throw new IllegalStateException("Session id was not present in session start response.");
        }

        return matcher.group(1);
    }
}
