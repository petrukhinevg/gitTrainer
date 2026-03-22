package com.example.gittrainer.session.api;

import com.example.gittrainer.session.domain.RetryHintSelection;
import com.example.gittrainer.session.infrastructure.FixtureRetryFeedbackCatalog;
import com.example.gittrainer.session.infrastructure.RetryFeedbackFixtureSource;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RetryHintResponseFactoryTest {

    private final RetryHintResponseFactory factory = new RetryHintResponseFactory(
            new FixtureRetryFeedbackCatalog(new RetryFeedbackFixtureSource())
    );

    @Test
    void exposesBothHintLevelsWhenStrongGuidanceIsUnlocked() {
        RetryHintResponse response = factory.guidedResponse(
                RetryHintSelection.selected("strong", "branch-intent-strong")
        );

        assertThat(response.status()).isEqualTo("guided");
        assertThat(response.level()).isEqualTo("strong");
        assertThat(response.reveals())
                .extracting(RetryHintRevealResponse::id)
                .containsExactly("nudge", "strong");
    }

    @Test
    void returnsBaselineHintWhenSelectionIsMissing() {
        RetryHintResponse response = factory.guidedResponse(null);

        assertThat(response.level()).isEqualTo("baseline");
        assertThat(response.reveals()).isEmpty();
    }
}
