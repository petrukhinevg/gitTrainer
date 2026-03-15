package com.example.gittrainer.scenario.domain;

import java.util.List;

public record CatalogBrowseQuery(String difficulty, List<String> tags, String sort) {

    public CatalogBrowseQuery {
        tags = tags == null ? null : List.copyOf(tags);
    }
}
