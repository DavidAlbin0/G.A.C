package com.micSer.envArch.domain.repository;

import com.micSer.envArch.domain.model.FileMetadata;
import java.util.List;
import java.util.Optional;

public interface FileRepositoryPort {
    FileMetadata save(FileMetadata fileMetadata);
    Optional<FileMetadata> findById(String id);
    List<FileMetadata> findByUserId(String userId);
    Optional<FileMetadata> findByUserIdAndFileName(String userId, String fileName);
    void deleteById(String id);
}
