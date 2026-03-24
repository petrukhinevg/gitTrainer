package com.example.gittrainer.scenario.api;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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
                .andExpect(jsonPath("$.items.length()").value(7))
                .andExpect(jsonPath("$.items[0].id").value("branch-safety"))
                .andExpect(jsonPath("$.items[0].difficulty").value("beginner"))
                .andExpect(jsonPath("$.items[2].slug").value("tag-checkpoint-preview"))
                .andExpect(jsonPath("$.items[2].tags[1]").value("inspection"));
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
                .andExpect(jsonPath("$.items.length()").value(4))
                .andExpect(jsonPath("$.items[0].id").value("branch-safety"))
                .andExpect(jsonPath("$.items[1].id").value("status-basics"))
                .andExpect(jsonPath("$.items[2].id").value("tag-checkpoint-preview"))
                .andExpect(jsonPath("$.items[3].id").value("stash-checkpoint-draft"));
    }

    @Test
    void sortsCatalogByDifficultyThenTitleWhenRequested() throws Exception {
                mockMvc.perform(get("/api/scenarios")
                        .param("sort", "difficulty")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(7))
                .andExpect(jsonPath("$.items[0].id").value("branch-safety"))
                .andExpect(jsonPath("$.items[1].id").value("status-basics"))
                .andExpect(jsonPath("$.items[2].id").value("tag-checkpoint-preview"))
                .andExpect(jsonPath("$.items[3].id").value("stash-checkpoint-draft"))
                .andExpect(jsonPath("$.items[4].id").value("remote-sync-preview"))
                .andExpect(jsonPath("$.items[5].id").value("history-cleanup-preview"))
                .andExpect(jsonPath("$.items[6].id").value("merge-sandbox-outline"));
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
                .andExpect(jsonPath("$.title").value("Источник сценариев недоступен"))
                .andExpect(jsonPath("$.detail").value("Источник каталога сейчас недоступен. Выберите другой источник или повторите позже."))
                .andExpect(jsonPath("$.code").value("scenario-source-unavailable"))
                .andExpect(jsonPath("$.failureDisposition").value("retryable"))
                .andExpect(jsonPath("$.retryable").value(true))
                .andExpect(jsonPath("$.sourceName").value("mvp-fixture-unavailable"));
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
                .andExpect(jsonPath("$.workspace.task.goal").value("Вы на `main`. Перед любым `add`, `checkout` или очисткой нужно коротко проверить, какие файлы уже изменены и какие ещё не отслеживаются."))
                .andExpect(jsonPath("$.workspace.task.instructions.length()").value(3))
                .andExpect(jsonPath("$.workspace.task.instructions[0].id").value("inspect-working-tree-first"))
                .andExpect(jsonPath("$.workspace.task.instructions[0].text").value("Не меняйте репозиторий. Первый ответ должен быть командой чтения статуса."))
                .andExpect(jsonPath("$.workspace.task.instructions[1].id").value("confirm-short-status-signals"))
                .andExpect(jsonPath("$.workspace.task.steps.length()").value(5))
                .andExpect(jsonPath("$.workspace.task.steps[0].position").value(1))
                .andExpect(jsonPath("$.workspace.task.steps[0].title").value("Заметьте, что вы уже на `main`"))
                .andExpect(jsonPath("$.workspace.task.steps[1].position").value(2))
                .andExpect(jsonPath("$.workspace.task.annotations.length()").value(2))
                .andExpect(jsonPath("$.workspace.task.annotations[0].label").value("Что нужно увидеть"))
                .andExpect(jsonPath("$.workspace.task.annotations[1].label").value("Какой шаг ожидается"))
                .andExpect(jsonPath("$.workspace.repositoryContext.status").value("authored-fixture"))
                .andExpect(jsonPath("$.workspace.repositoryContext.branches.length()").value(2))
                .andExpect(jsonPath("$.workspace.repositoryContext.branches[0].name").value("main"))
                .andExpect(jsonPath("$.workspace.repositoryContext.branches[0].current").value(true))
                .andExpect(jsonPath("$.workspace.repositoryContext.commits.length()").value(2))
                .andExpect(jsonPath("$.workspace.repositoryContext.commits[0].id").value("a1c9e31"))
                .andExpect(jsonPath("$.workspace.repositoryContext.graph.nodes.length()").value(2))
                .andExpect(jsonPath("$.workspace.repositoryContext.graph.nodes[0].id").value("a1c9e31"))
                .andExpect(jsonPath("$.workspace.repositoryContext.files.length()").value(3))
                .andExpect(jsonPath("$.workspace.repositoryContext.files[1].path").value("notes/status-checklist.md"))
                .andExpect(jsonPath("$.workspace.repositoryContext.files[1].status").value("untracked"))
                .andExpect(jsonPath("$.workspace.repositoryContext.annotations.length()").value(2))
                .andExpect(jsonPath("$.workspace.repositoryContext.annotations[0].label").value("Сигнал рабочего дерева"))
                .andExpect(jsonPath("$.workspace.repositoryContext.annotations[1].label").value("Почему нельзя спешить"));
    }

    @Test
    void exposesHistoryCleanupScenarioThroughDetailBoundaryWithPreviewFirstCues() throws Exception {
        mockMvc.perform(get("/api/scenarios/history-cleanup-preview")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value("history-cleanup-preview"))
                .andExpect(jsonPath("$.title").value("Собери preview истории перед cleanup"))
                .andExpect(jsonPath("$.summary").value("В `feature/history-cleanup` наверху лежат `fixup!` и WIP-коммиты. Сначала покажи компактный граф истории, а не запускай `rebase -i`."))
                .andExpect(jsonPath("$.workspace.task.goal").value("Нужно безопасно посмотреть верхушку истории и увидеть, какие коммиты пойдут в cleanup, не переписывая их."))
                .andExpect(jsonPath("$.workspace.task.instructions[0].id").value("preview-commit-graph-before-rewrite"))
                .andExpect(jsonPath("$.workspace.task.instructions[0].text").value("Оставайтесь в режиме просмотра. Никакого `rebase`, `reset` или `commit --amend`."))
                .andExpect(jsonPath("$.workspace.task.steps[0].title").value("Посмотрите на верхушку ветки"))
                .andExpect(jsonPath("$.workspace.task.annotations[0].label").value("Что нужно увидеть"))
                .andExpect(jsonPath("$.workspace.repositoryContext.branches[0].name").value("feature/history-cleanup"))
                .andExpect(jsonPath("$.workspace.repositoryContext.commits[0].summary").value("fixup! ui: переименовать бейдж оболочки"))
                .andExpect(jsonPath("$.workspace.repositoryContext.graph.nodes[0].summary").value("fixup! ui: переименовать бейдж оболочки"))
                .andExpect(jsonPath("$.workspace.repositoryContext.annotations[0].label").value("Сигнал для cleanup"))
                .andExpect(jsonPath("$.workspace.repositoryContext.annotations[1].label").value("Почему rebase пока рано"));
    }

    @Test
    void exposesRemoteSyncScenarioThroughDetailBoundaryWithFetchFirstCues() throws Exception {
        mockMvc.perform(get("/api/scenarios/remote-sync-preview")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value("remote-sync-preview"))
                .andExpect(jsonPath("$.title").value("Сначала обнови `origin/main` перед интеграцией"))
                .andExpect(jsonPath("$.summary").value("Локальная `main` уже ушла вперёд, но данные об `origin/main` могут быть устаревшими. Сначала сделай `fetch`, а уже потом думай про `pull`."))
                .andExpect(jsonPath("$.workspace.task.goal").value("Сначала обновите remote-tracking refs и только после этого решайте, нужен ли `pull`, `merge` или `rebase`."))
                .andExpect(jsonPath("$.workspace.task.instructions[0].id").value("refresh-remote-state-before-integration"))
                .andExpect(jsonPath("$.workspace.task.instructions[0].text").value("Не интегрируйте удалённые коммиты сразу. Первый шаг здесь — отдельный `fetch`."))
                .andExpect(jsonPath("$.workspace.task.steps[0].title").value("Заметьте, что данные об `origin/main` могут устареть"))
                .andExpect(jsonPath("$.workspace.task.annotations[0].label").value("Что проверяем"))
                .andExpect(jsonPath("$.workspace.repositoryContext.branches[0].name").value("main"))
                .andExpect(jsonPath("$.workspace.repositoryContext.branches[1].name").value("origin/main"))
                .andExpect(jsonPath("$.workspace.repositoryContext.annotations[0].label").value("Сигнал неполной картины"))
                .andExpect(jsonPath("$.workspace.repositoryContext.annotations[1].label").value("Почему `pull` пока рано"));
    }

    @Test
    void exposesBranchSafetyScenarioThroughDetailBoundaryWithInspectionFirstCues() throws Exception {
        mockMvc.perform(get("/api/scenarios/branch-safety")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value("branch-safety"))
                .andExpect(jsonPath("$.title").value("Подтверди ветку и незавершённый hotfix"))
                .andExpect(jsonPath("$.summary").value("Вы уже на `release/hotfix-7`, а `src/ui/header.css` и `docs/release-checklist.md` изменены. Сначала подтвердите ветку и только потом решайте, можно ли переключаться."))
                .andExpect(jsonPath("$.workspace.task.goal").value("Перед любым `checkout` нужно подтвердить, что работа уже открыта в `release/hotfix-7`, и собрать branch-aware status незавершённых правок."))
                .andExpect(jsonPath("$.workspace.task.instructions[0].id").value("confirm-active-branch-before-switching"))
                .andExpect(jsonPath("$.workspace.task.instructions[0].text").value("Сначала покажите, какая ветка активна сейчас. Без этого решение о переключении будет догадкой."))
                .andExpect(jsonPath("$.workspace.task.steps[0].title").value("Подтвердите активную ветку"))
                .andExpect(jsonPath("$.workspace.task.annotations[0].label").value("Что проверяем"))
                .andExpect(jsonPath("$.workspace.repositoryContext.branches[0].name").value("release/hotfix-7"))
                .andExpect(jsonPath("$.workspace.repositoryContext.branches[0].current").value(true))
                .andExpect(jsonPath("$.workspace.repositoryContext.annotations[0].label").value("Что видно в репозитории"))
                .andExpect(jsonPath("$.workspace.repositoryContext.annotations[1].label").value("Почему нельзя переключаться сразу"));
    }

    @Test
    void returnsNotFoundWhenRequestedScenarioDetailDoesNotExistInActiveSource() throws Exception {
        mockMvc.perform(get("/api/scenarios/not-a-real-scenario")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Сценарий не найден"))
                .andExpect(jsonPath("$.detail").value("Сценарий не найден: not-a-real-scenario"))
                .andExpect(jsonPath("$.code").value("scenario-not-found"))
                .andExpect(jsonPath("$.failureDisposition").value("terminal"))
                .andExpect(jsonPath("$.retryable").value(false));
    }

    @Test
    void exposesUnavailableDetailSourceThroughDetailBoundary() throws Exception {
        mockMvc.perform(get("/api/scenarios/status-basics")
                        .param("source", "unavailable")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.title").value("Источник сценариев недоступен"))
                .andExpect(jsonPath("$.detail").value("Источник каталога сейчас недоступен. Выберите другой источник или повторите позже."))
                .andExpect(jsonPath("$.code").value("scenario-source-unavailable"))
                .andExpect(jsonPath("$.failureDisposition").value("retryable"))
                .andExpect(jsonPath("$.retryable").value(true))
                .andExpect(jsonPath("$.sourceName").value("mvp-fixture-unavailable"));
    }
}
