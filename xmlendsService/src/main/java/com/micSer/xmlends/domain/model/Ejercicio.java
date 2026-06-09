package com.micSer.xmlends.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ejercicio {
    private String id;
    private int numeroFacturas;
    private BigDecimal montoReembolso;
    private java.time.LocalDate fechaInicio;
    private java.time.LocalDate fechaFin;
    private String userPropietario;
    private String userAdmin;
    private String empresaID;
}
