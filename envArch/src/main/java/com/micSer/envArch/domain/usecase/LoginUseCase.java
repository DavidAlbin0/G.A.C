package com.micSer.envArch.domain.usecase;

import com.micSer.envArch.domain.model.User;
import com.micSer.envArch.domain.repository.UserRepositoryPort;
import org.springframework.security.crypto.password.PasswordEncoder;

public class LoginUseCase {

    private final UserRepositoryPort userRepositoryPort;
    private final PasswordEncoder passwordEncoder;

    public LoginUseCase(UserRepositoryPort userRepositoryPort, PasswordEncoder passwordEncoder) {
        this.userRepositoryPort = userRepositoryPort;
        this.passwordEncoder = passwordEncoder;
    }

    public User execute(String username, String password) {
        User user = userRepositoryPort.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario o contraseña incorrectos"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Usuario o contraseña incorrectos");
        }

        return user;
    }
}
