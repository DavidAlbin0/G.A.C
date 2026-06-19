package com.micSer.envArch.service;

import com.micSer.envArch.model.User;
import com.micSer.envArch.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas para RegisterService")
class RegisterServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private RegisterService registerService;

    @Test
    @DisplayName("Debería registrar el usuario de forma exitosa")
    void execute_ShouldRegisterUserSuccessfully_WhenValidInput() {
        String username = "david_admin";
        String email = "david@grupo-sacmag.com.mx";
        String password = "Password123!";
        String encodedPassword = "encodedPassword123";
        String rfc = "XAXX010101000";
        String empresaId = "EMP01";
        String role = "ADMIN";

        when(userRepository.existsByUsername(username)).thenReturn(false);
        when(userRepository.existsByEmail(email)).thenReturn(false);
        when(passwordEncoder.encode(password)).thenReturn(encodedPassword);

        User expectedUser = User.builder()
                .id("db-id-1")
                .username(username)
                .email(email)
                .password(encodedPassword)
                .rfc(rfc)
                .roles(Set.of(role))
                .empresaId(empresaId)
                .build();

        when(userRepository.save(any(User.class))).thenReturn(expectedUser);

        User result = registerService.execute(username, email, password, rfc, empresaId, role);

        assertNotNull(result);
        assertEquals("db-id-1", result.getId());
        assertEquals(username, result.getUsername());
        assertEquals(email, result.getEmail());
        assertEquals(encodedPassword, result.getPassword());
        assertEquals(rfc, result.getRfc());
        assertTrue(result.getRoles().contains(role));
        assertEquals(empresaId, result.getEmpresaId());

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Debería fallar si el correo no pertenece a @grupo-sacmag.com.mx")
    void execute_ShouldThrowException_WhenEmailIsNotCorporate() {
        String correoInvalido = "david_externo@gmail.com";

        IllegalArgumentException excepcion = assertThrows(IllegalArgumentException.class, () -> {
            registerService.execute(
                    "david_admin",
                    correoInvalido,
                    "Password123!",
                    "XAXX010101000",
                    "EMP01",
                    "ADMIN");
        });

        assertEquals("El correo electrónico debe pertenecer al dominio corporativo @grupo-sacmag.com.mx",
                excepcion.getMessage());

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debería lanzar excepción si la contraseña es débil")
    void execute_ShouldThrowException_WhenPasswordIsWeak() {
        String weakPassword = "123";

        IllegalArgumentException excepcion = assertThrows(IllegalArgumentException.class, () -> {
            registerService.execute(
                    "david_admin",
                    "david@grupo-sacmag.com.mx",
                    weakPassword,
                    "XAXX010101000",
                    "EMP01",
                    "ADMIN");
        });

        assertEquals("La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial",
                excepcion.getMessage());

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debería lanzar excepción si el RFC no tiene formato válido")
    void execute_ShouldThrowException_WhenRfcIsInvalid() {
        String invalidRfc = "RFC_INVALIDO";

        IllegalArgumentException excepcion = assertThrows(IllegalArgumentException.class, () -> {
            registerService.execute(
                    "david_admin",
                    "david@grupo-sacmag.com.mx",
                    "Password123!",
                    invalidRfc,
                    "EMP01",
                    "ADMIN");
        });

        assertEquals("El RFC debe tener un formato válido con homoclave",
                excepcion.getMessage());

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debería lanzar excepción si el rol no es válido")
    void execute_ShouldThrowException_WhenRoleIsInvalid() {
        String invalidRole = "ROLE_EXTERNAL";

        IllegalArgumentException excepcion = assertThrows(IllegalArgumentException.class, () -> {
            registerService.execute(
                    "david_admin",
                    "david@grupo-sacmag.com.mx",
                    "Password123!",
                    "XAXX010101000",
                    "EMP01",
                    invalidRole);
        });

        assertEquals("El rol especificado no es válido",
                excepcion.getMessage());

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debería lanzar excepción si el nombre de usuario ya existe")
    void execute_ShouldThrowException_WhenUsernameAlreadyExists() {
        String username = "david_admin";

        when(userRepository.existsByUsername(username)).thenReturn(true);

        RuntimeException excepcion = assertThrows(RuntimeException.class, () -> {
            registerService.execute(
                    username,
                    "david@grupo-sacmag.com.mx",
                    "Password123!",
                    "XAXX010101000",
                    "EMP01",
                    "ADMIN");
        });

        assertEquals("El nombre de usuario ya está en uso", excepcion.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debería lanzar excepción si el email ya existe")
    void execute_ShouldThrowException_WhenEmailAlreadyExists() {
        String username = "david_admin";
        String email = "david@grupo-sacmag.com.mx";

        when(userRepository.existsByUsername(username)).thenReturn(false);
        when(userRepository.existsByEmail(email)).thenReturn(true);

        RuntimeException excepcion = assertThrows(RuntimeException.class, () -> {
            registerService.execute(
                    username,
                    email,
                    "Password123!",
                    "XAXX010101000",
                    "EMP01",
                    "ADMIN");
        });

        assertEquals("El correo electrónico ya está en uso", excepcion.getMessage());
        verify(userRepository, never()).save(any());
    }
}
