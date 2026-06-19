package com.micSer.envArch.service;

import com.micSer.envArch.model.User;
import com.micSer.envArch.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RegisterService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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

        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("El nombre de usuario ya está en uso");
        }

        if (userRepository.existsByEmail(email)) {
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

        return userRepository.save(newUser);
    }
}
