package com.micSer.xmlends.infrastructure.adapter.persistence;

import com.micSer.xmlends.domain.model.Factura;
import com.micSer.xmlends.domain.repository.FacturaRepositoryPort;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class FacturaMongoAdapter implements FacturaRepositoryPort {

    private final FacturaMongoRepository repository;

    public FacturaMongoAdapter(FacturaMongoRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Factura> findById(String id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Factura> findByUserID(String userID) {
        return repository.findByUserID(userID).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Factura> findByEmpresaID(String empresaID) {
        return repository.findByEmpresaID(empresaID).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Factura> findByEjercicioID(String ejercicioID) {
        return repository.findByEjercicioID(ejercicioID).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Factura> findAll() {
        return repository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Factura save(Factura factura) {
        FacturaDocument doc = toDocument(factura);
        FacturaDocument saved = repository.save(doc);
        return toDomain(saved);
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
    }

    private Factura toDomain(FacturaDocument doc) {
        return Factura.builder()
                .id(doc.getId())
                .tipoFactura(doc.getTipoFactura())
                .concepto(doc.getConcepto())
                .fechaFactura(doc.getFechaFactura())
                .fechaRegistro(doc.getFechaRegistro())
                .xmlPath(doc.getXmlPath())
                .pdfPath(doc.getPdfPath())
                .fileName(doc.getFileName())
                .status(doc.getStatus())
                .statusMotivo(doc.getStatusMotivo())
                .userID(doc.getUserID())
                .userName(doc.getUserName())
                .empresaID(doc.getEmpresaID())
                .ejercicioID(doc.getEjercicioID())
                .rechazadoPorEmail(doc.getRechazadoPorEmail())
                .apelado(doc.isApelado())
                .justificacionApelacion(doc.getJustificacionApelacion())
                .apelacionDenegada(doc.isApelacionDenegada())
                .contenidoXml(doc.getContenidoXml())
                .noDeducible(doc.getNoDeducible())
                .build();
    }

    private FacturaDocument toDocument(Factura domain) {
        return FacturaDocument.builder()
                .id(domain.getId())
                .tipoFactura(domain.getTipoFactura())
                .concepto(domain.getConcepto())
                .fechaFactura(domain.getFechaFactura())
                .fechaRegistro(domain.getFechaRegistro())
                .xmlPath(domain.getXmlPath())
                .pdfPath(domain.getPdfPath())
                .fileName(domain.getFileName())
                .status(domain.getStatus())
                .statusMotivo(domain.getStatusMotivo())
                .userID(domain.getUserID())
                .userName(domain.getUserName())
                .empresaID(domain.getEmpresaID())
                .ejercicioID(domain.getEjercicioID())
                .rechazadoPorEmail(domain.getRechazadoPorEmail())
                .apelado(domain.isApelado())
                .justificacionApelacion(domain.getJustificacionApelacion())
                .apelacionDenegada(domain.isApelacionDenegada())
                .contenidoXml(domain.getContenidoXml())
                .noDeducible(domain.getNoDeducible())
                .build();
    }
}
