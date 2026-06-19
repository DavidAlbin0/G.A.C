package com.micSer.envArch.repository;

import com.micSer.envArch.model.Empresa;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface EmpresaRepository extends MongoRepository<Empresa, String> {
    Optional<Empresa> findByNombre(String nombre);
}
