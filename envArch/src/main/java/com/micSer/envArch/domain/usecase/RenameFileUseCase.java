package com.micSer.envArch.domain.usecase;

import com.micSer.envArch.domain.model.FileMetadata;
import com.micSer.envArch.domain.repository.FileRepositoryPort;

@lombok.RequiredArgsConstructor
public class RenameFileUseCase {

    private final FileRepositoryPort fileRepositoryPort;

    public FileMetadata execute(String fileId, String userId, String newFileName) {
        FileMetadata fileMetadata = fileRepositoryPort.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        if (!fileMetadata.getUserId().equals(userId)) {
            throw new SecurityException("No estás autorizado para renombrar este archivo");
        }

        fileMetadata.setFileName(newFileName);
        return fileRepositoryPort.save(fileMetadata);
    }
}
