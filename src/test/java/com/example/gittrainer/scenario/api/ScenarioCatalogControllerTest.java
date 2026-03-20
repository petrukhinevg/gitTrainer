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
    void returnsAuthoredFixtureCatalogBoundary() throws Exception {
        mockMvc.perform(get("/api/scenarios")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.meta.source").value("mvp-fixture"))
                .andExpect(jsonPath("$.items.length()").value(4))
                .andExpect(jsonPath("$.items[0].id").value("branch-safety"))
                .andExpect(jsonPath("$.items[0].difficulty").value("beginner"))
                .andExpect(jsonPath("$.items[1].slug").value("remote-sync-preview"))
                .andExpect(jsonPath("$.items[1].tags[1]").value("inspection"));
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
                .andExpect(jsonPath("$.items.length()").value(4))
                .andExpect(jsonPath("$.items[0].id").value("branch-safety"))
                .andExpect(jsonPath("$.items[1].id").value("status-basics"))
                .andExpect(jsonPath("$.items[2].id").value("remote-sync-preview"))
                .andExpect(jsonPath("$.items[3].id").value("history-cleanup-preview"));
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

    @Test
    void ignoresBlankTagFiltersWhenApplyingCatalogPolicy() throws Exception {
        mockMvc.perform(get("/api/scenarios")
                        .param("tag", "   ")
                        .param("tag", "status")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value("status-basics"))
                .andExpect(jsonPath("$.meta.query.tags[0]").value("   "))
                .andExpect(jsonPath("$.meta.query.tags[1]").value("status"));
    }

    @Test
    void exposesEmptyFixtureThroughCatalogBoundary() throws Exception {
        mockMvc.perform(get("/api/scenarios")
                        .param("source", "empty")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.source").value("mvp-fixture-empty"))
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void exposesUnavailableFixtureThroughCatalogBoundary() throws Exception {
        mockMvc.perform(get("/api/scenarios")
                        .param("source", "unavailable")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.detail").value("Источник каталога сейчас недоступен. Выберите другой источник или повторите позже."));
    }

    @Test
    void exposesScenarioDetailStubBoundaryForKnownScenario() throws Exception {
        mockMvc.perform(get("/api/scenarios/status-basics")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value("status-basics"))
                .andExpect(jsonPath("$.slug").value("status-basics"))
                .andExpect(jsonPath("$.difficulty").value("beginner"))
                .andExpect(jsonPath("$.meta.source").value("mvp-fixture"))
                .andExpect(jsonPath("$.meta.stub").value(true))
                .andExpect(jsonPath("$.workspace.shell.leftPanelTitle").value("Карта сценария"))
                .andExpect(jsonPath("$.workspace.shell.centerPanelTitle").value("Урок"))
                .andExpect(jsonPath("$.workspace.shell.rightPanelTitle").value("Практика"))
                .andExpect(jsonPath("$.workspace.task.status").value("authored-fixture"))
                .andExpect(jsonPath("$.workspace.task.goal").value("Сначала проверьте состояние рабочего дерева и только после этого выбирайте следующий шаг."))
                .andExpect(jsonPath("$.workspace.task.instructions.length()").value(3))
                .andExpect(jsonPath("$.workspace.task.instructions[0].id").value("inspect-working-tree-first"))
                .andExpect(jsonPath("$.workspace.task.instructions[0].text").value("Начните с команды проверки состояния, а не с переключения ветки или изменения файлов."))
                .andExpect(jsonPath("$.workspace.task.instructions[1].id").value("confirm-short-status-signals"))
                .andExpect(jsonPath("$.workspace.task.steps.length()").value(3))
                .andExpect(jsonPath("$.workspace.task.steps[0].position").value(1))
                .andExpect(jsonPath("$.workspace.task.steps[0].title").value("Начните с проверки рабочего дерева"))
                .andExpect(jsonPath("$.workspace.task.steps[1].position").value(2))
                .andExpect(jsonPath("$.workspace.task.annotations.length()").value(2))
                .andExpect(jsonPath("$.workspace.task.annotations[0].label").value("Целевой результат"))
                .andExpect(jsonPath("$.workspace.task.annotations[1].label").value("Подсказка по проверке"))
                .andExpect(jsonPath("$.workspace.repositoryContext.status").value("authored-fixture"))
                .andExpect(jsonPath("$.workspace.repositoryContext.branches.length()").value(2))
                .andExpect(jsonPath("$.workspace.repositoryContext.branches[0].name").value("main"))
                .andExpect(jsonPath("$.workspace.repositoryContext.branches[0].current").value(true))
                .andExpect(jsonPath("$.workspace.repositoryContext.commits.length()").value(2))
                .andExpect(jsonPath("$.workspace.repositoryContext.commits[0].id").value("a1c9e31"))
                .andExpect(jsonPath("$.workspace.repositoryContext.files.length()").value(3))
                .andExpect(jsonPath("$.workspace.repositoryContext.files[1].path").value("notes/status-checklist.md"))
                .andExpect(jsonPath("$.workspace.repositoryContext.files[1].status").value("untracked"))
                .andExpect(jsonPath("$.workspace.repositoryContext.annotations.length()").value(2))
                .andExpect(jsonPath("$.workspace.repositoryContext.annotations[0].label").value("Подсказка рабочего дерева"))
                .andExpect(jsonPath("$.workspace.repositoryContext.annotations[1].label").value("Подсказка для решения"));
    }

    @Test
    void exposesHistoryCleanupScenarioThroughDetailBoundaryWithPreviewFirstCues() throws Exception {
        mockMvc.perform(get("/api/scenarios/history-cleanup-preview")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value("history-cleanup-preview"))
                .andExpect(jsonPath("$.title").value("Просмотри историю перед очисткой"))
                .andExpect(jsonPath("$.summary").value("Сначала собери компактный preview последних коммитов с `fixup!` и WIP-сигналами, а уже потом решай, как чистить историю."))
                .andExpect(jsonPath("$.workspace.task.goal").value("Сначала просмотрите недавний граф коммитов с `fixup!` и WIP-сигналами, а уже потом формулируйте план очистки без переписывания истории."))
                .andExpect(jsonPath("$.workspace.task.instructions[0].id").value("preview-commit-graph-before-rewrite"))
                .andExpect(jsonPath("$.workspace.task.instructions[0].text").value("Начните с команды чтения истории, а не с `rebase -i`, чтобы сначала увидеть стек проблемных коммитов."))
                .andExpect(jsonPath("$.workspace.task.steps[0].title").value("Просмотрите верхушку истории"))
                .andExpect(jsonPath("$.workspace.task.annotations[0].label").value("Что считается безопасным шагом"))
                .andExpect(jsonPath("$.workspace.repositoryContext.branches[0].name").value("feature/history-cleanup"))
                .andExpect(jsonPath("$.workspace.repositoryContext.commits[0].summary").value("fixup! ui: переименовать бейдж оболочки"))
                .andExpect(jsonPath("$.workspace.repositoryContext.annotations[0].label").value("Сигнал для preview истории"))
                .andExpect(jsonPath("$.workspace.repositoryContext.annotations[1].label").value("Почему rebase ещё рано"));
    }

    @Test
    void returnsNotFoundWhenRequestedScenarioDetailDoesNotExistInActiveSource() throws Exception {
        mockMvc.perform(get("/api/scenarios/not-a-real-scenario")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Сценарий не найден: not-a-real-scenario"));
    }

    @Test
    void exposesUnavailableDetailSourceThroughDetailBoundary() throws Exception {
        mockMvc.perform(get("/api/scenarios/status-basics")
                        .param("source", "unavailable")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.detail").value("Источник каталога сейчас недоступен. Выберите другой источник или повторите позже."));
    }
}
