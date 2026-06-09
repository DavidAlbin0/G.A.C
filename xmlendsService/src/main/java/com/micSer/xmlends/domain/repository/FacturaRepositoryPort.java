package com.micSer.xmlends.domain.repository;

import com.micSer.xmlends.domain.model.Factura;
import java.util.List;
import java.util.Optional;

public interface FacturaRepositoryPort {
    Optional<Factura> findById(String id);
    List<Factura> findByUserID(String userID);
    List<Factura> findByEmpresaID(String empresaID);
    List<Factura> findByEjercicioID(String ejercicioID);
    List<Factura> findAll();
    Factura save(Factura factura);
    void deleteById(String id);
}
