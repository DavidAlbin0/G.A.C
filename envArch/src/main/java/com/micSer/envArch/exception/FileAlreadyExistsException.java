package com.micSer.envArch.exception;

import com.micSer.envArch.model.FileMetadata;

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
