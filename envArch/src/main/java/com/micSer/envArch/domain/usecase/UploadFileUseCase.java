package com.micSer.envArch.domain.usecase;

import com.micSer.envArch.domain.model.FileMetadata;
import com.micSer.envArch.domain.repository.FileRepositoryPort;
import com.micSer.envArch.domain.repository.FileStoragePort;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Optional;

public class UploadFileUseCase {

    private final FileRepositoryPort fileRepositoryPort;
    private final FileStoragePort fileStoragePort;

    public UploadFileUseCase(FileRepositoryPort fileRepositoryPort, FileStoragePort fileStoragePort) {
        this.fileRepositoryPort = fileRepositoryPort;
        this.fileStoragePort = fileStoragePort;
    }

    public FileMetadata execute(String fileName, long fileSize, String contentType, String userId, InputStream inputStream) {
        // 1. Store the file physically
        String filePath = fileStoragePort.store(inputStream, fileName);

        // 2. Save metadata to DB
        FileMetadata metadata = FileMetadata.builder()
                .fileName(fileName)
                .filePath(filePath)
                .fileSize(fileSize)
                .contentType(contentType)
                .userId(userId)
                .uploadTime(LocalDateTime.now())
                .build();

        return fileRepositoryPort.save(metadata);
    }
}
