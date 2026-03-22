package com.example.gittrainer.validation.application;

import com.example.gittrainer.validation.domain.ValidationRunRecord;

public interface ValidationRunRepository {

    void save(ValidationRunRecord validationRunRecord);
}
