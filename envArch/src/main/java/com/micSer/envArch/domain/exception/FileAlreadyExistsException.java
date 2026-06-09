package com.micSer.envArch.domain.exception;

import com.micSer.envArch.domain.model.FileMetadata;

public class FileAlreadyExistsException extends RuntimeException {
    private final FileMetadata existingFile;

    public FileAlreadyExistsException(String message, FileMetadata existingFile) {
        super(message);
        this.existingFile = existingFile;
    }

    public FileMetadata getExistingFile() {
        return existingFile;
    }
}
