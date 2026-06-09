package com.micSer.envArch.domain.repository;

import com.micSer.envArch.domain.model.Empresa;
import java.util.List;
import java.util.Optional;

public interface EmpresaRepositoryPort {
    Optional<Empresa> findById(String id);
    Optional<Empresa> findByNombre(String nombre);
    List<Empresa> findAll();
    Empresa save(Empresa empresa);
}
