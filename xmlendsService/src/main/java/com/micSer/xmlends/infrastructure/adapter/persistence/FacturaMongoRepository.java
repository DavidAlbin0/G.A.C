package com.micSer.xmlends.infrastructure.adapter.persistence;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FacturaMongoRepository extends MongoRepository<FacturaDocument, String> {
    List<FacturaDocument> findByUserID(String userID);
    List<FacturaDocument> findByEmpresaID(String empresaID);
    List<FacturaDocument> findByEjercicioID(String ejercicioID);
}
