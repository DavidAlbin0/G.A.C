package com.micSer.envArch.infrastructure.adapter.persistence;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface EmpresaMongoRepository extends MongoRepository<EmpresaDocument, String> {
    Optional<EmpresaDocument> findByNombre(String nombre);
}
