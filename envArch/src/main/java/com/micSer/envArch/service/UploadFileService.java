package com.micSer.envArch.service;

import com.micSer.envArch.model.FileMetadata;
import com.micSer.envArch.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UploadFileService {

    private final FileMetadataRepository fileMetadataRepository;
    private final FileStorageService fileStorageService;

    public FileMetadata execute(String fileName, long fileSize, String contentType, String userId, InputStream inputStream) {
        String filePath = fileStorageService.store(inputStream, fileName);

        FileMetadata metadata = FileMetadata.builder()
                .fileName(fileName)
                .filePath(filePath)
                .fileSize(fileSize)
                .contentType(contentType)
                .userId(userId)
                .uploadTime(LocalDateTime.now())
                .build();

        return fileMetadataRepository.save(metadata);
    }
}
