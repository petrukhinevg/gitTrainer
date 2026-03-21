package com.example.gittrainer.progress.application;

import java.util.List;

public interface ProgressScenarioCatalogReadPort {

    ProgressScenarioCatalogSnapshot loadCatalog();

    record ProgressScenarioCatalogSnapshot(
            List<ProgressScenarioSnapshot> items,
            String source
    ) {
    }

    record ProgressScenarioSnapshot(
            String slug,
            String title
    ) {
    }
}
