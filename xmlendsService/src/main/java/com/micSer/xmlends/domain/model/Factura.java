package com.micSer.xmlends.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Factura {
    private String id;
    private String tipoFactura;
    private String concepto;
    private LocalDateTime fechaFactura;
    private LocalDateTime fechaRegistro;
    private String xmlPath;
    private String pdfPath;
    private String fileName;
    private String status; // VALIDO, NO_VALIDO, REVISION
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
