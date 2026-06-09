package com.micSer.xmlends.domain.repository;

import com.micSer.xmlends.domain.model.Ejercicio;
import java.util.List;
import java.util.Optional;

public interface EjercicioRepositoryPort {
    Optional<Ejercicio> findById(String id);
    List<Ejercicio> findByUserPropietario(String userPropietario);
    List<Ejercicio> findByEmpresaID(String empresaID);
    List<Ejercicio> findAll();
    Ejercicio save(Ejercicio ejercicio);
}
