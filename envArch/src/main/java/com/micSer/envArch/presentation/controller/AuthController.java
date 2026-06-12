package com.micSer.envArch.presentation.controller;

import com.micSer.envArch.domain.model.User;
import com.micSer.envArch.domain.model.Empresa;
import com.micSer.envArch.domain.repository.UserRepositoryPort;
import com.micSer.envArch.domain.repository.EmpresaRepositoryPort;
import com.micSer.envArch.domain.usecase.ChangePasswordUseCase;
import com.micSer.envArch.domain.usecase.LoginUseCase;
import com.micSer.envArch.domain.usecase.RegisterUseCase;
import com.micSer.envArch.presentation.dto.AuthResponse;
import com.micSer.envArch.presentation.dto.ChangePasswordRequest;
import com.micSer.envArch.presentation.dto.LoginRequest;
import com.micSer.envArch.presentation.dto.RegisterRequest;
import com.micSer.envArch.presentation.dto.UserResponse;
import com.micSer.envArch.infrastructure.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
@lombok.RequiredArgsConstructor
public class AuthController {

    private final LoginUseCase loginUseCase;
    private final RegisterUseCase registerUseCase;
    private final ChangePasswordUseCase changePasswordUseCase;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepositoryPort userRepositoryPort;
    private final EmpresaRepositoryPort empresaRepositoryPort;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        User registeredUser = registerUseCase.execute(
                request.getUsername(),
                request.getEmail(),
                request.getPassword(),
                request.getRfc(),
                request.getEmpresaId(),
                request.getRole()
        );
        UserResponse response = new UserResponse(
                registeredUser.getId(),
                registeredUser.getUsername(),
                registeredUser.getEmail(),
                registeredUser.getRfc(),
                registeredUser.getRoles(),
                registeredUser.getEmpresaId()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = loginUseCase.execute(request.getUsername(), request.getPassword());
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRoles(), user.getId(), user.getEmpresaId(), user.getEmail());
        AuthResponse response = new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRfc(),
                user.getRoles(),
                user.getEmpresaId()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepositoryPort.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        UserResponse response = new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRfc(),
                user.getRoles(),
                user.getEmpresaId()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        changePasswordUseCase.execute(username, request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/empresas")
    public ResponseEntity<List<Empresa>> getEmpresas() {
        return ResponseEntity.ok(empresaRepositoryPort.findAll());
    }

    @GetMapping("/users/{idOrUsername}")
    public ResponseEntity<UserResponse> getUserByIdOrUsername(@PathVariable String idOrUsername) {
        User user = userRepositoryPort.findById(idOrUsername)
                .orElseGet(() -> userRepositoryPort.findByUsername(idOrUsername)
                        .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                                org.springframework.http.HttpStatus.NOT_FOUND, "Usuario no encontrado")));
        
        UserResponse response = new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRfc(),
                user.getRoles(),
                user.getEmpresaId()
        );
        return ResponseEntity.ok(response);
    }
}
