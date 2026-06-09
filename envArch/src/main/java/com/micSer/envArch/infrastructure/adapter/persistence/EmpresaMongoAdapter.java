package com.micSer.envArch.infrastructure.adapter.persistence;

import com.micSer.envArch.domain.model.Empresa;
import com.micSer.envArch.domain.repository.EmpresaRepositoryPort;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class EmpresaMongoAdapter implements EmpresaRepositoryPort {

    private final EmpresaMongoRepository repository;

    public EmpresaMongoAdapter(EmpresaMongoRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Empresa> findById(String id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Empresa> findByNombre(String nombre) {
        return repository.findByNombre(nombre).map(this::toDomain);
    }

    @Override
    public List<Empresa> findAll() {
        return repository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Empresa save(Empresa empresa) {
        EmpresaDocument doc = toDocument(empresa);
        EmpresaDocument saved = repository.save(doc);
        return toDomain(saved);
    }

    private Empresa toDomain(EmpresaDocument doc) {
        return Empresa.builder()
                .id(doc.getId())
                .nombre(doc.getNombre())
                .razonSocial(doc.getRazonSocial())
                .rfc(doc.getRfc())
                .build();
    }

    private EmpresaDocument toDocument(Empresa domain) {
        return EmpresaDocument.builder()
                .id(domain.getId())
                .nombre(domain.getNombre())
                .razonSocial(domain.getRazonSocial())
                .rfc(domain.getRfc())
                .build();
    }
}
