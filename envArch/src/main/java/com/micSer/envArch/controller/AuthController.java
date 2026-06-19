package com.micSer.envArch.controller;

import com.micSer.envArch.model.User;
import com.micSer.envArch.model.Empresa;
import com.micSer.envArch.repository.UserRepository;
import com.micSer.envArch.repository.EmpresaRepository;
import com.micSer.envArch.service.ChangePasswordService;
import com.micSer.envArch.service.LoginService;
import com.micSer.envArch.service.RegisterService;
import com.micSer.envArch.controller.dto.AuthResponse;
import com.micSer.envArch.controller.dto.ChangePasswordRequest;
import com.micSer.envArch.controller.dto.LoginRequest;
import com.micSer.envArch.controller.dto.RegisterRequest;
import com.micSer.envArch.controller.dto.UserResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.micSer.envArch.config.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticación", description = "JWT, Autenticacion, administracion de tipo usuario y así")
@lombok.RequiredArgsConstructor
public class AuthController {

        private final LoginService loginService;
        private final RegisterService registerService;
        private final ChangePasswordService changePasswordService;
        private final JwtTokenProvider jwtTokenProvider;
        private final UserRepository userRepository;
        private final EmpresaRepository empresaRepository;

        @PostMapping("/register")
        public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
                User registeredUser = registerService.execute(
                                request.getUsername(),
                                request.getEmail(),
                                request.getPassword(),
                                request.getRfc(),
                                request.getEmpresaId(),
                                request.getRole());
                UserResponse response = new UserResponse(
                                registeredUser.getId(),
                                registeredUser.getUsername(),
                                registeredUser.getEmail(),
                                registeredUser.getRfc(),
                                registeredUser.getRoles(),
                                registeredUser.getEmpresaId());
                return ResponseEntity.ok(response);
        }

        @PostMapping("/login")
        public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
                User user = loginService.execute(request.getUsername(), request.getPassword());
                String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRoles(), user.getId(),
                                user.getEmpresaId(), user.getEmail());
                AuthResponse response = new AuthResponse(
                                token,
                                user.getId(),
                                user.getUsername(),
                                user.getEmail(),
                                user.getRfc(),
                                user.getRoles(),
                                user.getEmpresaId());
                return ResponseEntity.ok(response);
        }

        @GetMapping("/me")
        public ResponseEntity<UserResponse> getCurrentUser() {
                String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                UserResponse response = new UserResponse(
                                user.getId(),
                                user.getUsername(),
                                user.getEmail(),
                                user.getRfc(),
                                user.getRoles(),
                                user.getEmpresaId());
                return ResponseEntity.ok(response);
        }

        @PostMapping("/change-password")
        public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
                String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
                changePasswordService.execute(username, request.getOldPassword(), request.getNewPassword());
                return ResponseEntity.ok().build();
        }

        @GetMapping("/empresas")
        public ResponseEntity<List<Empresa>> getEmpresas() {
                return ResponseEntity.ok(empresaRepository.findAll());
        }

        @GetMapping("/users/{idOrUsername}")
        public ResponseEntity<UserResponse> getUserByIdOrUsername(@PathVariable String idOrUsername) {
                User user = userRepository.findById(idOrUsername)
                                .orElseGet(() -> userRepository.findByUsername(idOrUsername)
                                                 .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                                                                 org.springframework.http.HttpStatus.NOT_FOUND,
                                                                 "Usuario no encontrado")));

                UserResponse response = new UserResponse(
                                user.getId(),
                                user.getUsername(),
                                user.getEmail(),
                                user.getRfc(),
                                user.getRoles(),
                                user.getEmpresaId());
                return ResponseEntity.ok(response);
        }
}
