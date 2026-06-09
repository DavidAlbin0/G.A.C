package com.micSer.envArch.domain.usecase;

import com.micSer.envArch.domain.model.User;
import com.micSer.envArch.domain.repository.UserRepositoryPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Set;

public class RegisterUseCase {

    private final UserRepositoryPort userRepositoryPort;
    private final PasswordEncoder passwordEncoder;

    public RegisterUseCase(UserRepositoryPort userRepositoryPort, PasswordEncoder passwordEncoder) {
        this.userRepositoryPort = userRepositoryPort;
        this.passwordEncoder = passwordEncoder;
    }

    public User execute(String username, String email, String password, String rfc, String empresaId, String role) {
        if (email == null || !email.toLowerCase().endsWith("@grupo-sacmag.com.mx")) {
            throw new IllegalArgumentException("El correo electrónico debe pertenecer al dominio corporativo @grupo-sacmag.com.mx");
        }

        String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).{10,}$";
        if (password == null || !password.matches(passwordRegex)) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial");
        }

        String rfcRegex = "^[A-Z&Ñ]{3,4}\\d{6}[A-Z0-9]{3}$";
        if (rfc == null || !rfc.matches(rfcRegex)) {
            throw new IllegalArgumentException("El RFC debe tener un formato válido con homoclave");
        }

        if (role == null || !Set.of("ADMIN", "USER_REMB", "USER_SUP_LEC").contains(role)) {
            throw new IllegalArgumentException("El rol especificado no es válido");
        }

        if (userRepositoryPort.existsByUsername(username)) {
            throw new RuntimeException("El nombre de usuario ya está en uso");
        }

        if (userRepositoryPort.existsByEmail(email)) {
            throw new RuntimeException("El correo electrónico ya está en uso");
        }

        String encodedPassword = passwordEncoder.encode(password);

        User newUser = User.builder()
                .username(username)
                .email(email)
                .password(encodedPassword)
                .rfc(rfc)
                .roles(Set.of(role))
                .empresaId(empresaId)
                .build();

        return userRepositoryPort.save(newUser);
    }
}
