package com.micSer.envArch.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "empresas")
public class Empresa {
    @Id
    private String id;
    private String nombre;
    private String razonSocial;
    private String rfc;
}
