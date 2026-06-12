package com.micSer.envArch.domain.usecase;

import com.micSer.envArch.domain.model.FileMetadata;
import com.micSer.envArch.domain.repository.FileRepositoryPort;
import com.micSer.envArch.domain.repository.FileStoragePort;

import java.io.InputStream;
import java.time.LocalDateTime;

@lombok.RequiredArgsConstructor
public class ReplaceFileUseCase {

    private final FileRepositoryPort fileRepositoryPort;
    private final FileStoragePort fileStoragePort;

    public FileMetadata execute(String fileId, String userId, String fileName, long fileSize, String contentType, InputStream inputStream) {
        FileMetadata existingMetadata = fileRepositoryPort.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        if (!existingMetadata.getUserId().equals(userId)) {
            throw new SecurityException("No estás autorizado para modificar este archivo");
        }

        // Delete the old file from disk
        fileStoragePort.delete(existingMetadata.getFilePath());

        // Store the new file on disk
        String newFilePath = fileStoragePort.store(inputStream, fileName);

        // Update database metadata
        existingMetadata.setFileName(fileName);
        existingMetadata.setFilePath(newFilePath);
        existingMetadata.setFileSize(fileSize);
        existingMetadata.setContentType(contentType);
        existingMetadata.setUploadTime(LocalDateTime.now());

        return fileRepositoryPort.save(existingMetadata);
    }
}
