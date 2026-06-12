package com.micSer.envArch.domain.usecase;

import com.micSer.envArch.domain.model.FileMetadata;
import com.micSer.envArch.domain.repository.FileRepositoryPort;
import com.micSer.envArch.domain.repository.FileStoragePort;

import java.io.InputStream;

@lombok.RequiredArgsConstructor
public class DownloadFileUseCase {

    private final FileRepositoryPort fileRepositoryPort;
    private final FileStoragePort fileStoragePort;

    public InputStream execute(String fileId, String userId) {
        FileMetadata metadata = fileRepositoryPort.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        if (!metadata.getUserId().equals(userId)) {
            throw new SecurityException("No estás autorizado para acceder a este archivo");
        }

        return fileStoragePort.load(metadata.getFilePath());
    }

    public FileMetadata getMetadata(String fileId, String userId) {
        FileMetadata metadata = fileRepositoryPort.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        if (!metadata.getUserId().equals(userId)) {
            throw new SecurityException("No estás autorizado para acceder a este archivo");
        }

        return metadata;
    }
}
