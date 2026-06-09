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
public class NoDeducible {
    private BigDecimal reembolsoNoDeducible;
    private String motivo;
    private BigDecimal montoFactura;
}
