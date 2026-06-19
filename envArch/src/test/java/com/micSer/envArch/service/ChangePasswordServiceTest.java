package com.micSer.envArch.service;

import com.micSer.envArch.model.User;
import com.micSer.envArch.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChangePasswordServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private ChangePasswordService changePasswordService;

    @Test
    void execute_ShouldSucceed_WhenValidInput() {
        String username = "testuser";
        String oldPassword = "OldPassword123!";
        String newPassword = "NewPassword123!";
        String encodedOldPassword = "encodedOldPassword";
        String encodedNewPassword = "encodedNewPassword";

        User user = User.builder()
                .id("user-123")
                .username(username)
                .password(encodedOldPassword)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(oldPassword, encodedOldPassword)).thenReturn(true);
        when(passwordEncoder.encode(newPassword)).thenReturn(encodedNewPassword);

        changePasswordService.execute(username, oldPassword, newPassword);

        assertEquals(encodedNewPassword, user.getPassword());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void execute_ShouldThrowRuntimeException_WhenUserNotFound() {
        String username = "nonexistent";
        String oldPassword = "OldPassword123!";
        String newPassword = "NewPassword123!";

        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                changePasswordService.execute(username, oldPassword, newPassword)
        );

        assertEquals("Usuario no encontrado", exception.getMessage());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void execute_ShouldThrowRuntimeException_WhenOldPasswordIncorrect() {
        String username = "testuser";
        String oldPassword = "WrongOldPassword!";
        String newPassword = "NewPassword123!";
        String encodedOldPassword = "encodedOldPassword";

        User user = User.builder()
                .id("user-123")
                .username(username)
                .password(encodedOldPassword)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(oldPassword, encodedOldPassword)).thenReturn(false);

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                changePasswordService.execute(username, oldPassword, newPassword)
        );

        assertEquals("La contraseña actual es incorrecta", exception.getMessage());
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "short1!",       // less than 10 chars (8 chars)
            "nouppercase1!", // no uppercase
            "NOLOWERCASE1!", // no lowercase
            "NoSpecialChar1",// no special character
            "NoDigit!!!!!"   // no digit
    })
    void execute_ShouldThrowIllegalArgumentException_WhenNewPasswordInvalid(String invalidNewPassword) {
        String username = "testuser";
        String oldPassword = "OldPassword123!";
        String encodedOldPassword = "encodedOldPassword";

        User user = User.builder()
                .id("user-123")
                .username(username)
                .password(encodedOldPassword)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(oldPassword, encodedOldPassword)).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                changePasswordService.execute(username, oldPassword, invalidNewPassword)
        );

        assertEquals("La nueva contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial", exception.getMessage());
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void execute_ShouldThrowIllegalArgumentException_WhenNewPasswordIsNull() {
        String username = "testuser";
        String oldPassword = "OldPassword123!";
        String encodedOldPassword = "encodedOldPassword";

        User user = User.builder()
                .id("user-123")
                .username(username)
                .password(encodedOldPassword)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(oldPassword, encodedOldPassword)).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                changePasswordService.execute(username, oldPassword, null)
        );

        assertEquals("La nueva contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial", exception.getMessage());
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }
}
