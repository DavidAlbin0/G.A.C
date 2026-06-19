package com.micSer.envArch.service;

import com.micSer.envArch.model.User;
import com.micSer.envArch.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoginServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private LoginService loginService;

    @Test
    void execute_ShouldSucceed_WhenValidCredentials() {
        String username = "testuser";
        String password = "Password123!";
        String encodedPassword = "encodedPassword";

        User user = User.builder()
                .username(username)
                .password(encodedPassword)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(password, encodedPassword)).thenReturn(true);

        User result = loginService.execute(username, password);

        assertNotNull(result);
        assertEquals(username, result.getUsername());
        verify(userRepository, times(1)).findByUsername(username);
        verify(passwordEncoder, times(1)).matches(password, encodedPassword);
    }

    @Test
    void execute_ShouldThrowRuntimeException_WhenUserNotFound() {
        String username = "nonexistent";
        String password = "Password123!";

        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                loginService.execute(username, password)
        );

        assertEquals("Usuario o contraseña incorrectos", exception.getMessage());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void execute_ShouldThrowRuntimeException_WhenPasswordIncorrect() {
        String username = "testuser";
        String password = "WrongPassword!";
        String encodedPassword = "encodedPassword";

        User user = User.builder()
                .username(username)
                .password(encodedPassword)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(password, encodedPassword)).thenReturn(false);

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                loginService.execute(username, password)
        );

        assertEquals("Usuario o contraseña incorrectos", exception.getMessage());
        verify(userRepository, times(1)).findByUsername(username);
        verify(passwordEncoder, times(1)).matches(password, encodedPassword);
    }
}
