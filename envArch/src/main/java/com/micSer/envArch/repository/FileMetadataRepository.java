package com.micSer.envArch.repository;

import com.micSer.envArch.model.FileMetadata;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FileMetadataRepository extends MongoRepository<FileMetadata, String> {
    List<FileMetadata> findByUserId(String userId);
}
