package com.micSer.envArch.domain.repository;

import com.micSer.envArch.domain.model.User;
import java.util.Optional;

public interface UserRepositoryPort {
    Optional<User> findByUsername(String username);
    Optional<User> findById(String id);
    User save(User user);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
