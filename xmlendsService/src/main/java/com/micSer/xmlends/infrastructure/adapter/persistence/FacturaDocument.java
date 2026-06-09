package com.micSer.xmlends.infrastructure.adapter.persistence;

import com.micSer.xmlends.domain.model.ContenidoXml;
import com.micSer.xmlends.domain.model.NoDeducible;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "facturas")
public class FacturaDocument {
    @Id
    private String id;
    private String tipoFactura;
    private String concepto;
    private LocalDateTime fechaFactura;
    private LocalDateTime fechaRegistro;
    private String xmlPath;
    private String pdfPath;
    private String fileName;
    private String status;
    private String statusMotivo;
    private String userID;
    private String userName;
    private String empresaID;
    private String ejercicioID;
    private String rechazadoPorEmail;
    private boolean apelado;
    private String justificacionApelacion;
    private boolean apelacionDenegada;
    private ContenidoXml contenidoXml;
    private NoDeducible noDeducible;
}
