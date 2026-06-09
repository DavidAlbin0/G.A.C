package com.micSer.xmlends.infrastructure.adapter.persistence;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ejercicios")
public class EjercicioDocument {
    @Id
    private String id;
    private int numeroFacturas;
    private BigDecimal montoReembolso;
    private java.time.LocalDate fechaInicio;
    private java.time.LocalDate fechaFin;
    private String userPropietario;
    private String userAdmin;
    private String empresaID;
}
