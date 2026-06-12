package com.micSer.envArch.domain.usecase;

import com.micSer.envArch.domain.model.FileMetadata;
import com.micSer.envArch.domain.repository.FileRepositoryPort;
import com.micSer.envArch.domain.repository.FileStoragePort;

@lombok.RequiredArgsConstructor
public class DeleteFileUseCase {

    private final FileRepositoryPort fileRepositoryPort;
    private final FileStoragePort fileStoragePort;

    public void execute(String fileId, String userId) {
        FileMetadata metadata = fileRepositoryPort.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        if (!metadata.getUserId().equals(userId)) {
            throw new SecurityException("No estás autorizado para eliminar este archivo");
        }

        // Delete physical file
        fileStoragePort.delete(metadata.getFilePath());

        // Delete database metadata
        fileRepositoryPort.deleteById(fileId);
    }
}
