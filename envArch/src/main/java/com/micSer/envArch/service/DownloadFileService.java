package com.micSer.envArch.service;

import com.micSer.envArch.model.FileMetadata;
import com.micSer.envArch.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.io.InputStream;

@Service
@RequiredArgsConstructor
public class DownloadFileService {

    private final FileMetadataRepository fileMetadataRepository;
    private final FileStorageService fileStorageService;

    public InputStream execute(String fileId, String userId) {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        if (!metadata.getUserId().equals(userId)) {
            throw new SecurityException("No estás autorizado para acceder a este archivo");
        }

        return fileStorageService.load(metadata.getFilePath());
    }

    public FileMetadata getMetadata(String fileId, String userId) {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        if (!metadata.getUserId().equals(userId)) {
            throw new SecurityException("No estás autorizado para acceder a este archivo");
        }

        return metadata;
    }
}
