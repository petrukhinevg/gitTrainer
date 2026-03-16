package com.example.gittrainer.session.api;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class SessionControllerTest {

    private final WebApplicationContext webApplicationContext;
    private MockMvc mockMvc;

    SessionControllerTest(WebApplicationContext webApplicationContext) {
        this.webApplicationContext = webApplicationContext;
    }

    @BeforeEach
    void setUpMockMvc() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext).build();
    }

    @Test
    void startsSessionForKnownScenario() throws Exception {
        mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "scenarioSlug": "status-basics"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.sessionId").isNotEmpty())
                .andExpect(jsonPath("$.scenario.slug").value("status-basics"))
                .andExpect(jsonPath("$.scenario.title").value("Read the working tree before acting"))
                .andExpect(jsonPath("$.scenario.source").value("mvp-fixture"))
                .andExpect(jsonPath("$.lifecycle.status").value("active"))
                .andExpect(jsonPath("$.lifecycle.startedAt").isNotEmpty())
                .andExpect(jsonPath("$.lifecycle.submissionCount").value(0))
                .andExpect(jsonPath("$.submission.supportedAnswerTypes[0]").value("command_text"))
                .andExpect(jsonPath("$.submission.placeholderOutcome.status").value("placeholder"))
                .andExpect(jsonPath("$.submission.placeholderOutcome.correctness").value("not-evaluated"))
                .andExpect(jsonPath("$.submission.placeholderOutcome.code").value("awaiting-first-submission"))
                .andExpect(jsonPath("$.submission.placeholderOutcome.message").value("Session transport and correctness checks are ready. Submit an answer to receive an evaluated result."));
    }

    @Test
    void rejectsMissingScenarioSlugWhenStartingSession() throws Exception {
        mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "scenarioSlug": "   "
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid session request"))
                .andExpect(jsonPath("$.detail").value("Scenario slug is required to start a session."))
                .andExpect(jsonPath("$.code").value("scenario-slug-required"))
                .andExpect(jsonPath("$.failureDisposition").value("terminal"))
                .andExpect(jsonPath("$.retryable").value(false));
    }

    @Test
    void returnsNotFoundWhenStartingSessionForUnknownScenario() throws Exception {
        mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "scenarioSlug": "not-a-real-scenario"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Scenario not found"))
                .andExpect(jsonPath("$.detail").value("Scenario detail is unavailable for slug: not-a-real-scenario"))
                .andExpect(jsonPath("$.code").value("scenario-not-found"))
                .andExpect(jsonPath("$.failureDisposition").value("terminal"))
                .andExpect(jsonPath("$.retryable").value(false));
    }

    @Test
    void returnsUnavailableWhenScenarioSourceFailsDuringSessionStart() throws Exception {
        mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "scenarioSlug": "status-basics",
                                  "source": "unavailable"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.title").value("Scenario source unavailable"))
                .andExpect(jsonPath("$.detail").value("Catalog source is unavailable right now. Try another provider."))
                .andExpect(jsonPath("$.code").value("scenario-source-unavailable"))
                .andExpect(jsonPath("$.failureDisposition").value("retryable"))
                .andExpect(jsonPath("$.retryable").value(true))
                .andExpect(jsonPath("$.sourceName").value("mvp-fixture-unavailable"));
    }

    @Test
    void acceptsCorrectSubmissionAgainstActiveSession() throws Exception {
        String sessionId = startSessionAndExtractId();

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
                .andExpect(jsonPath("$.submissionId").isNotEmpty())
                .andExpect(jsonPath("$.sessionId").value(sessionId))
                .andExpect(jsonPath("$.attemptNumber").value(1))
                .andExpect(jsonPath("$.submittedAt").isNotEmpty())
                .andExpect(jsonPath("$.lifecycle.status").value("active"))
                .andExpect(jsonPath("$.lifecycle.submissionCount").value(1))
                .andExpect(jsonPath("$.lifecycle.lastSubmissionId").isNotEmpty())
                .andExpect(jsonPath("$.answer.type").value("command_text"))
                .andExpect(jsonPath("$.answer.value").value("git status"))
                .andExpect(jsonPath("$.outcome.status").value("evaluated"))
                .andExpect(jsonPath("$.outcome.correctness").value("correct"))
                .andExpect(jsonPath("$.outcome.code").value("expected-command"));
    }

    @Test
    void returnsIncorrectOutcomeForUnexpectedCommand() throws Exception {
        String sessionId = startSessionAndExtractId();

        mockMvc.perform(post("/api/sessions/{sessionId}/submissions", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "answerType": "command_text",
                                  "answer": "git checkout main"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(sessionId))
                .andExpect(jsonPath("$.attemptNumber").value(1))
                .andExpect(jsonPath("$.outcome.status").value("evaluated"))
                .andExpect(jsonPath("$.outcome.correctness").value("incorrect"))
                .andExpect(jsonPath("$.outcome.code").value("unexpected-command"));
    }

    @Test
    void acceptsAlternateCorrectCommandVariantForScenario() throws Exception {
        String sessionId = startSessionAndExtractId();

        mockMvc.perform(post("/api/sessions/{sessionId}/submissions", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "answerType": "command_text",
                                  "answer": "git status --short"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(sessionId))
                .andExpect(jsonPath("$.attemptNumber").value(1))
                .andExpect(jsonPath("$.outcome.status").value("evaluated"))
                .andExpect(jsonPath("$.outcome.correctness").value("correct"))
                .andExpect(jsonPath("$.outcome.code").value("expected-command"));
    }

    @Test
    void rejectsBlankSubmissionAnswer() throws Exception {
        String sessionId = startSessionAndExtractId();

        mockMvc.perform(post("/api/sessions/{sessionId}/submissions", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "answerType": "command_text",
                                  "answer": "   "
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid session request"))
                .andExpect(jsonPath("$.detail").value("Answer text is required to submit a session attempt."))
                .andExpect(jsonPath("$.code").value("answer-required"))
                .andExpect(jsonPath("$.failureDisposition").value("terminal"))
                .andExpect(jsonPath("$.retryable").value(false));
    }

    @Test
    void returnsUnsupportedOutcomeForUnsupportedSubmissionAnswerType() throws Exception {
        String sessionId = startSessionAndExtractId();

        mockMvc.perform(post("/api/sessions/{sessionId}/submissions", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "answerType": "file_patch",
                                  "answer": "git status"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(sessionId))
                .andExpect(jsonPath("$.attemptNumber").value(1))
                .andExpect(jsonPath("$.answer.type").value("file_patch"))
                .andExpect(jsonPath("$.outcome.status").value("evaluated"))
                .andExpect(jsonPath("$.outcome.correctness").value("unsupported"))
                .andExpect(jsonPath("$.outcome.code").value("unsupported-answer-type"));
    }

    @Test
    void returnsNotFoundWhenSubmittingAgainstUnknownSession() throws Exception {
        mockMvc.perform(post("/api/sessions/{sessionId}/submissions", "session_missing")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "answer": "git status"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Session not found"))
                .andExpect(jsonPath("$.detail").value("Session is unavailable for id: session_missing"))
                .andExpect(jsonPath("$.code").value("session-not-found"))
                .andExpect(jsonPath("$.failureDisposition").value("terminal"))
                .andExpect(jsonPath("$.retryable").value(false));
    }

    @Test
    void countsUnsupportedAnswerTypeAsEvaluatedAttempt() throws Exception {
        String sessionId = startSessionAndExtractId();

        mockMvc.perform(post("/api/sessions/{sessionId}/submissions", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "answerType": "file_patch",
                                  "answer": "git status"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attemptNumber").value(1))
                .andExpect(jsonPath("$.lifecycle.submissionCount").value(1))
                .andExpect(jsonPath("$.outcome.correctness").value("unsupported"));

        mockMvc.perform(post("/api/sessions/{sessionId}/submissions", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "answerType": "command_text",
                                  "answer": "git status"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attemptNumber").value(2))
                .andExpect(jsonPath("$.lifecycle.submissionCount").value(2));
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

        String responseBody = result.getResponse().getContentAsString();
        return responseBody.replaceFirst(".*\"sessionId\":\"([^\"]+)\".*", "$1");
    }
}
