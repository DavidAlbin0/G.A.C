package com.micSer.envArch.infrastructure.adapter.persistence;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface FileMetadataMongoRepository extends MongoRepository<FileMetadataDocument, String> {
    List<FileMetadataDocument> findByUserId(String userId);
    Optional<FileMetadataDocument> findByUserIdAndFileName(String userId, String fileName);
}
