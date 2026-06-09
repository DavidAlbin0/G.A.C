package com.micSer.envArch.infrastructure.adapter.persistence;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserMongoRepository extends MongoRepository<UserDocument, String> {
    Optional<UserDocument> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
