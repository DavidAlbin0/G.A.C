package com.micSer.xmlends.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContenidoXml {
    private String rfcEmisor;
    private String nombreEmisor;
    private String rfcReceptor;
    private String nombreReceptor;
    private String usoCFDI;
    private BigDecimal subtotal;
    private BigDecimal total;
    private String moneda;
    private String metodoPago;
    private String formatoPago;
    private LocalDateTime fechaTimbrado;
}
