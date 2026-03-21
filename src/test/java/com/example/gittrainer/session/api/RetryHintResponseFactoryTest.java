package com.example.gittrainer.session.api;

import com.example.gittrainer.session.domain.RetryHintSelection;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RetryHintResponseFactoryTest {

    private final RetryHintResponseFactory factory = new RetryHintResponseFactory();

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
