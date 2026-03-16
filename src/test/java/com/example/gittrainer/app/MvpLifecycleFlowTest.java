package com.example.gittrainer.app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.context.WebApplicationContext;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class MvpLifecycleFlowTest {

    private final WebApplicationContext webApplicationContext;
    private final JsonParser jsonParser = JsonParserFactory.getJsonParser();
    private MockMvc mockMvc;

    MvpLifecycleFlowTest(WebApplicationContext webApplicationContext) {
        this.webApplicationContext = webApplicationContext;
    }

    @BeforeEach
    void setUpMockMvc() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext).build();
    }

    @Test
    void completesCurrentMvpFlowFromCatalogBrowseToEvaluatedSubmission() throws Exception {
        Map<String, Object> catalogResponse = performJson(get("/api/scenarios"));
        Map<String, Object> firstCatalogItem = firstMap(listValue(catalogResponse, "items"), "catalog items");

        String scenarioSlug = stringValue(firstCatalogItem, "slug");
        String scenarioTitle = stringValue(firstCatalogItem, "title");
        String acceptedCommand = firstAcceptedCommandFor(scenarioSlug);

        Map<String, Object> detailResponse = performJson(get("/api/scenarios/{slug}", scenarioSlug));
        assertThat(stringValue(detailResponse, "slug")).isEqualTo(scenarioSlug);
        assertThat(stringValue(detailResponse, "title")).isEqualTo(scenarioTitle);

        Map<String, Object> workspace = mapValue(detailResponse, "workspace");
        Map<String, Object> task = mapValue(workspace, "task");
        Map<String, Object> repositoryContext = mapValue(workspace, "repositoryContext");

        assertThat(stringValue(task, "goal")).isNotBlank();
        assertThat(stringValue(repositoryContext, "status")).isNotBlank();

        Map<String, Object> startSessionResponse = performJson(
                post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "scenarioSlug": "%s"
                                }
                                """.formatted(scenarioSlug))
        );

        String sessionId = stringValue(startSessionResponse, "sessionId");
        Map<String, Object> sessionScenario = mapValue(startSessionResponse, "scenario");
        Map<String, Object> lifecycle = mapValue(startSessionResponse, "lifecycle");
        Map<String, Object> submissionBoundary = mapValue(startSessionResponse, "submission");
        String supportedAnswerType = String.valueOf(firstValue(listValue(submissionBoundary, "supportedAnswerTypes")));
        Map<String, Object> placeholderOutcome = mapValue(submissionBoundary, "placeholderOutcome");
        Map<String, Object> placeholderRetryFeedback = mapValue(submissionBoundary, "placeholderRetryFeedback");
        Map<String, Object> placeholderRetryState = mapValue(placeholderRetryFeedback, "retryState");

        assertThat(sessionId).isNotBlank();
        assertThat(stringValue(sessionScenario, "slug")).isEqualTo(scenarioSlug);
        assertThat(stringValue(sessionScenario, "title")).isEqualTo(scenarioTitle);
        assertThat(stringValue(lifecycle, "status")).isEqualTo("active");
        assertThat(intValue(lifecycle, "submissionCount")).isZero();
        assertThat(stringValue(placeholderOutcome, "status")).isEqualTo("placeholder");
        assertThat(stringValue(placeholderRetryFeedback, "status")).isEqualTo("placeholder");
        assertThat(stringValue(placeholderRetryState, "status")).isEqualTo("idle");
        assertThat(intValue(placeholderRetryState, "attemptNumber")).isZero();
        assertThat(supportedAnswerType).isEqualTo("command_text");

        Map<String, Object> submissionResponse = performJson(
                post("/api/sessions/{sessionId}/submissions", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "answerType": "%s",
                                  "answer": "%s"
                                }
                                """.formatted(supportedAnswerType, acceptedCommand))
        );

        Map<String, Object> submittedAnswer = mapValue(submissionResponse, "answer");
        Map<String, Object> outcome = mapValue(submissionResponse, "outcome");
        Map<String, Object> submissionLifecycle = mapValue(submissionResponse, "lifecycle");
        Map<String, Object> retryFeedback = mapValue(submissionResponse, "retryFeedback");
        Map<String, Object> retryState = mapValue(retryFeedback, "retryState");

        assertThat(stringValue(submissionResponse, "sessionId")).isEqualTo(sessionId);
        assertThat(intValue(submissionResponse, "attemptNumber")).isEqualTo(1);
        assertThat(stringValue(submittedAnswer, "type")).isEqualTo(supportedAnswerType);
        assertThat(stringValue(submittedAnswer, "value")).isEqualTo(acceptedCommand);
        assertThat(stringValue(outcome, "status")).isEqualTo("evaluated");
        assertThat(stringValue(outcome, "correctness")).isEqualTo("correct");
        assertThat(stringValue(outcome, "code")).isEqualTo("expected-command");
        assertThat(stringValue(retryFeedback, "status")).isEqualTo("placeholder");
        assertThat(stringValue(retryState, "status")).isEqualTo("complete");
        assertThat(intValue(retryState, "attemptNumber")).isEqualTo(1);
        assertThat(stringValue(submissionLifecycle, "status")).isEqualTo("active");
        assertThat(intValue(submissionLifecycle, "submissionCount")).isEqualTo(1);
        assertThat(stringValue(submissionLifecycle, "lastSubmissionId")).isEqualTo(
                stringValue(submissionResponse, "submissionId")
        );
    }

    private Map<String, Object> performJson(MockHttpServletRequestBuilder requestBuilder) throws Exception {
        MvcResult result = mockMvc.perform(requestBuilder.accept(MediaType.APPLICATION_JSON))
                .andExpect(status().is2xxSuccessful())
                .andReturn();
        return jsonParser.parseMap(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private String firstAcceptedCommandFor(String scenarioSlug) throws Exception {
        try (InputStream inputStream = getClass().getClassLoader()
                .getResourceAsStream("session/fixture-submission-rules.json")) {
            assertThat(inputStream).isNotNull();
            Map<String, Object> rules = jsonParser.parseMap(new String(inputStream.readAllBytes(), StandardCharsets.UTF_8));
            List<?> commands = listValue(rules, scenarioSlug);
            return String.valueOf(firstValue(commands));
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapValue(Map<String, Object> source, String key) {
        Object value = source.get(key);
        assertThat(value)
                .as("Expected object field `%s`", key)
                .isInstanceOf(Map.class);
        return (Map<String, Object>) value;
    }

    @SuppressWarnings("unchecked")
    private List<?> listValue(Map<String, Object> source, String key) {
        Object value = source.get(key);
        assertThat(value)
                .as("Expected list field `%s`", key)
                .isInstanceOf(List.class);
        return (List<?>) value;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> firstMap(List<?> items, String label) {
        assertThat(items)
                .as("Expected non-empty %s", label)
                .isNotEmpty();
        assertThat(items.getFirst())
                .as("Expected first %s entry to be an object", label)
                .isInstanceOf(Map.class);
        return (Map<String, Object>) items.getFirst();
    }

    private Object firstValue(List<?> items) {
        assertThat(items).as("Expected non-empty list").isNotEmpty();
        return items.getFirst();
    }

    private String stringValue(Map<String, Object> source, String key) {
        Object value = source.get(key);
        assertThat(value)
                .as("Expected string field `%s`", key)
                .isNotNull();
        return String.valueOf(value);
    }

    private int intValue(Map<String, Object> source, String key) {
        Object value = source.get(key);
        assertThat(value)
                .as("Expected numeric field `%s`", key)
                .isInstanceOf(Number.class);
        return ((Number) value).intValue();
    }
}
