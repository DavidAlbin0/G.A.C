package com.micSer.envArch.presentation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 6, max = 50, message = "El nombre de usuario debe tener entre 6 y 50 caracteres")
    private String username;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El correo electrónico debe ser válido")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@grupo-sacmag\\.com\\.mx$", message = "El correo debe pertenecer al dominio corporativo @grupo-sacmag.com.mx")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).{10,}$",
        message = "La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial"
    )
    private String password;

    @NotBlank(message = "El RFC es obligatorio")
    @Pattern(regexp = "^[A-Z&Ñ]{3,4}\\d{6}[A-Z0-9]{3}$", message = "El RFC debe tener un formato válido con homoclave")
    private String rfc;

    @NotBlank(message = "La empresa es obligatoria")
    private String empresaId;

    @NotBlank(message = "El rol es obligatorio")
    private String role;
}
