package com.micSer.xmlends.infrastructure.adapter.persistence;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface EjercicioMongoRepository extends MongoRepository<EjercicioDocument, String> {
    List<EjercicioDocument> findByUserPropietario(String userPropietario);
    List<EjercicioDocument> findByEmpresaID(String empresaID);
}
