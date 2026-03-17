package com.example.gittrainer.progress.domain;

public final class ProgressStatusPolicy {

    private ProgressStatusPolicy() {
    }

    public static ProgressStatus deriveStatus(ScenarioProgressRecord progressRecord) {
        if (progressRecord == null) {
            return ProgressStatus.NOT_STARTED;
        }
        if (progressRecord.completionCount() > 0) {
            return ProgressStatus.COMPLETED;
        }
        if (progressRecord.attemptCount() > 0 || progressRecord.lastStartedAt() != null) {
            return ProgressStatus.IN_PROGRESS;
        }
        return ProgressStatus.NOT_STARTED;
    }
}
