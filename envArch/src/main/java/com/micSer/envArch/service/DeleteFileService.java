package com.micSer.envArch.service;

import com.micSer.envArch.model.FileMetadata;
import com.micSer.envArch.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DeleteFileService {

    private final FileMetadataRepository fileMetadataRepository;
    private final FileStorageService fileStorageService;

    public void execute(String fileId, String userId) {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        if (!metadata.getUserId().equals(userId)) {
            throw new SecurityException("No estás autorizado para eliminar este archivo");
        }

        fileStorageService.delete(metadata.getFilePath());
        fileMetadataRepository.deleteById(fileId);
    }
}
