package com.example.gittrainer.validation.infrastructure;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class CliValidationProcessPolicy {

    private static final int DEFAULT_MAX_OUTPUT_BYTES = 16_384;

    private final boolean allowExternalExecutable;
    private final boolean inheritEnvironment;
    private final Path workingDirectory;
    private final Path allowedWorkingDirectoryRoot;
    private final int maxOutputBytes;

    public CliValidationProcessPolicy(
            @Value("${gittrainer.validator.cli.allow-external-executable:false}") boolean allowExternalExecutable,
            @Value("${gittrainer.validator.cli.inherit-environment:false}") boolean inheritEnvironment,
            @Value("${gittrainer.validator.cli.working-directory:${user.dir}}") String workingDirectory,
            @Value("${gittrainer.validator.cli.allowed-working-directory-root:${user.dir}}")
            String allowedWorkingDirectoryRoot,
            @Value("${gittrainer.validator.cli.max-output-bytes:16384}") int maxOutputBytes
    ) {
        this.allowExternalExecutable = allowExternalExecutable;
        this.inheritEnvironment = inheritEnvironment;
        this.workingDirectory = Path.of(workingDirectory).normalize();
        this.allowedWorkingDirectoryRoot = Path.of(allowedWorkingDirectoryRoot).normalize();
        this.maxOutputBytes = maxOutputBytes <= 0 ? DEFAULT_MAX_OUTPUT_BYTES : maxOutputBytes;
    }

    public boolean allowExternalExecutable() {
        return allowExternalExecutable;
    }

    public boolean inheritEnvironment() {
        return inheritEnvironment;
    }

    public Path workingDirectory() {
        return workingDirectory;
    }

    public Path allowedWorkingDirectoryRoot() {
        return allowedWorkingDirectoryRoot;
    }

    public int maxOutputBytes() {
        return maxOutputBytes;
    }

    public boolean isWorkingDirectoryUsable() {
        return workingDirectory.isAbsolute() && Files.isDirectory(workingDirectory);
    }

    public boolean isWorkingDirectoryInsideAllowedRoot() {
        return allowedWorkingDirectoryRoot.isAbsolute()
                && Files.isDirectory(allowedWorkingDirectoryRoot)
                && workingDirectory.startsWith(allowedWorkingDirectoryRoot);
    }
}
