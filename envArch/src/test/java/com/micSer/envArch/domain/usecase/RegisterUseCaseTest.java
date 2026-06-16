package com.micSer.envArch.domain.usecase;

import com.micSer.envArch.domain.repository.UserRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas para RegisterUseCase")
class RegisterUseCaseTest {

    @Mock
    private UserRepositoryPort userRepositoryPort;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private RegisterUseCase registerUseCase;

    @Test
    @DisplayName("Debería fallar si el correo no pertenece a @grupo-sacmag.com.mx")
    void execute_ShouldThrowException_WhenEmailIsNotCorporate() {
        // 1. GIVEN (Preparar un correo externo inválido)
        String correoInvalido = "david_externo@gmail.com";

        // 2. WHEN & THEN (Ejecutar y verificar que lance la excepción esperada)
        IllegalArgumentException excepcion = assertThrows(IllegalArgumentException.class, () -> {
            registerUseCase.execute(
                    "david_admin",
                    correoInvalido,
                    "Password123!",
                    "XAXX010101000",
                    "EMP01",
                    "ADMIN");
        });

        // Verificamos que el mensaje del error sea el correcto
        assertEquals("El correo electrónico debe pertenecer al dominio corporativo @grupo-sacmag.com.mx",
                excepcion.getMessage());

        // 3. MOCKITO GUARDÍAN: Nos aseguramos de que NUNCA tocó la base de datos
        verify(userRepositoryPort, never()).save(any());
    }
}
