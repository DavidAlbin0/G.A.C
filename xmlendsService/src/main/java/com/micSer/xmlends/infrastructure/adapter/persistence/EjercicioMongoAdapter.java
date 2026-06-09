package com.micSer.xmlends.infrastructure.adapter.persistence;

import com.micSer.xmlends.domain.model.Ejercicio;
import com.micSer.xmlends.domain.repository.EjercicioRepositoryPort;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class EjercicioMongoAdapter implements EjercicioRepositoryPort {

    private final EjercicioMongoRepository repository;

    public EjercicioMongoAdapter(EjercicioMongoRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Ejercicio> findById(String id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Ejercicio> findByUserPropietario(String userPropietario) {
        return repository.findByUserPropietario(userPropietario).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Ejercicio> findByEmpresaID(String empresaID) {
        return repository.findByEmpresaID(empresaID).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Ejercicio> findAll() {
        return repository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Ejercicio save(Ejercicio ejercicio) {
        EjercicioDocument doc = toDocument(ejercicio);
        EjercicioDocument saved = repository.save(doc);
        return toDomain(saved);
    }

    private Ejercicio toDomain(EjercicioDocument doc) {
        return Ejercicio.builder()
                .id(doc.getId())
                .numeroFacturas(doc.getNumeroFacturas())
                .montoReembolso(doc.getMontoReembolso())
                .fechaInicio(doc.getFechaInicio())
                .fechaFin(doc.getFechaFin())
                .userPropietario(doc.getUserPropietario())
                .userAdmin(doc.getUserAdmin())
                .empresaID(doc.getEmpresaID())
                .build();
    }

    private EjercicioDocument toDocument(Ejercicio domain) {
        return EjercicioDocument.builder()
                .id(domain.getId())
                .numeroFacturas(domain.getNumeroFacturas())
                .montoReembolso(domain.getMontoReembolso())
                .fechaInicio(domain.getFechaInicio())
                .fechaFin(domain.getFechaFin())
                .userPropietario(domain.getUserPropietario())
                .userAdmin(domain.getUserAdmin())
                .empresaID(domain.getEmpresaID())
                .build();
    }
}
