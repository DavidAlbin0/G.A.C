package com.micSer.envArch.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    @NotBlank(message = "La contraseña actual no puede estar vacía")
    private String oldPassword;

    @NotBlank(message = "La nueva contraseña no puede estar vacía")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).{10,}$",
        message = "La nueva contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial"
    )
    private String newPassword;
}
