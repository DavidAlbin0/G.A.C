package com.micSer.envArch.service;

import com.micSer.envArch.model.FileMetadata;
import com.micSer.envArch.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RenameFileService {

    private final FileMetadataRepository fileMetadataRepository;

    public FileMetadata execute(String fileId, String userId, String newFileName) {
        FileMetadata fileMetadata = fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        if (!fileMetadata.getUserId().equals(userId)) {
            throw new SecurityException("No estás autorizado para renombrar este archivo");
        }

        fileMetadata.setFileName(newFileName);
        return fileMetadataRepository.save(fileMetadata);
    }
}
