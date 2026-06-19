package com.micSer.envArch.service;

import com.micSer.envArch.model.FileMetadata;
import com.micSer.envArch.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReplaceFileService {

    private final FileMetadataRepository fileMetadataRepository;
    private final FileStorageService fileStorageService;

    public FileMetadata execute(String fileId, String userId, String fileName, long fileSize, String contentType, InputStream inputStream) {
        FileMetadata existingMetadata = fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        if (!existingMetadata.getUserId().equals(userId)) {
            throw new SecurityException("No estás autorizado para modificar este archivo");
        }

        fileStorageService.delete(existingMetadata.getFilePath());
        String newFilePath = fileStorageService.store(inputStream, fileName);

        existingMetadata.setFileName(fileName);
        existingMetadata.setFilePath(newFilePath);
        existingMetadata.setFileSize(fileSize);
        existingMetadata.setContentType(contentType);
        existingMetadata.setUploadTime(LocalDateTime.now());

        return fileMetadataRepository.save(existingMetadata);
    }
}
