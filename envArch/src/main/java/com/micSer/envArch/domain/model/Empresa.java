package com.micSer.envArch.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Empresa {
    private String id;
    private String nombre;
    private String razonSocial;
    private String rfc;
}
