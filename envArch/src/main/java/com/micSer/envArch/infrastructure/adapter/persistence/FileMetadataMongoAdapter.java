package com.micSer.envArch.infrastructure.adapter.persistence;

import com.micSer.envArch.domain.model.FileMetadata;
import com.micSer.envArch.domain.repository.FileRepositoryPort;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@lombok.RequiredArgsConstructor
public class FileMetadataMongoAdapter implements FileRepositoryPort {

    private final FileMetadataMongoRepository repository;

    @Override
    public FileMetadata save(FileMetadata fileMetadata) {
        FileMetadataDocument doc = toDocument(fileMetadata);
        FileMetadataDocument saved = repository.save(doc);
        return toDomain(saved);
    }

    @Override
    public Optional<FileMetadata> findById(String id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public List<FileMetadata> findByUserId(String userId) {
        return repository.findByUserId(userId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<FileMetadata> findByUserIdAndFileName(String userId, String fileName) {
        return repository.findByUserIdAndFileName(userId, fileName).map(this::toDomain);
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
    }

    private FileMetadata toDomain(FileMetadataDocument doc) {
        return FileMetadata.builder()
                .id(doc.getId())
                .fileName(doc.getFileName())
                .filePath(doc.getFilePath())
                .fileSize(doc.getFileSize())
                .contentType(doc.getContentType())
                .userId(doc.getUserId())
                .uploadTime(doc.getUploadTime())
                .build();
    }

    private FileMetadataDocument toDocument(FileMetadata fileMetadata) {
        return FileMetadataDocument.builder()
                .id(fileMetadata.getId())
                .fileName(fileMetadata.getFileName())
                .filePath(fileMetadata.getFilePath())
                .fileSize(fileMetadata.getFileSize())
                .contentType(fileMetadata.getContentType())
                .userId(fileMetadata.getUserId())
                .uploadTime(fileMetadata.getUploadTime())
                .build();
    }
}
