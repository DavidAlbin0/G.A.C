package com.micSer.envArch.service;

import com.micSer.envArch.model.User;
import com.micSer.envArch.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LoginService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User execute(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario o contraseña incorrectos"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Usuario o contraseña incorrectos");
        }

        return user;
    }
}
