package com.example.gittrainer.scenario.api;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
record ScenarioCatalogQueryResponse(
        String difficulty,
        List<String> tags,
        String sort
) {
}
