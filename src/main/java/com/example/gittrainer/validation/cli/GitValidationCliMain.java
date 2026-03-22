package com.example.gittrainer.validation.cli;

import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public final class GitValidationCliMain {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper().findAndRegisterModules();

    private GitValidationCliMain() {
    }

    public static void main(String[] args) throws IOException {
        try {
            Path requestFile = resolveRequestFile(args);
            CliValidationRequest request = OBJECT_MAPPER.readValue(requestFile.toFile(), CliValidationRequest.class);
            CliValidationResponse response = GitValidationCliHandler.handle(request);
            System.out.print(OBJECT_MAPPER.writeValueAsString(response));
        } catch (ValidationRunnerExecutionException exception) {
            System.err.print(exception.getMessage());
            System.exit(1);
        } catch (IllegalArgumentException exception) {
            System.err.print(exception.getMessage());
            System.exit(2);
        }
    }

    private static Path resolveRequestFile(String[] args) {
        if (args == null || args.length != 2 || !"--request-file".equals(args[0])) {
            throw new IllegalArgumentException("Использование: --request-file <path>");
        }

        Path requestFile = Path.of(args[1]);
        if (!Files.isRegularFile(requestFile)) {
            throw new IllegalArgumentException("Файл request не найден: " + requestFile);
        }
        return requestFile;
    }
}
