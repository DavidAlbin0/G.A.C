package com.micSer.envArch.domain.usecase;

import com.micSer.envArch.domain.model.User;
import com.micSer.envArch.domain.repository.UserRepositoryPort;
import org.springframework.security.crypto.password.PasswordEncoder;

public class ChangePasswordUseCase {

    private final UserRepositoryPort userRepositoryPort;
    private final PasswordEncoder passwordEncoder;

    public ChangePasswordUseCase(UserRepositoryPort userRepositoryPort, PasswordEncoder passwordEncoder) {
        this.userRepositoryPort = userRepositoryPort;
        this.passwordEncoder = passwordEncoder;
    }

    public void execute(String username, String oldPassword, String newPassword) {
        User user = userRepositoryPort.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("La contraseña actual es incorrecta");
        }

        String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).{10,}$";
        if (newPassword == null || !newPassword.matches(passwordRegex)) {
            throw new IllegalArgumentException("La nueva contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial");
        }

        String encodedNewPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedNewPassword);
        userRepositoryPort.save(user);
    }
}
