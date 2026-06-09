package com.micSer.envArch.infrastructure.adapter.persistence;

import com.micSer.envArch.domain.model.User;
import com.micSer.envArch.domain.repository.UserRepositoryPort;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class UserMongoAdapter implements UserRepositoryPort {

    private final UserMongoRepository userMongoRepository;

    public UserMongoAdapter(UserMongoRepository userMongoRepository) {
        this.userMongoRepository = userMongoRepository;
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userMongoRepository.findByUsername(username)
                .map(this::toDomain);
    }

    @Override
    public Optional<User> findById(String id) {
        return userMongoRepository.findById(id)
                .map(this::toDomain);
    }

    @Override
    public User save(User user) {
        UserDocument doc = toDocument(user);
        UserDocument saved = userMongoRepository.save(doc);
        return toDomain(saved);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userMongoRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userMongoRepository.existsByEmail(email);
    }

    private User toDomain(UserDocument doc) {
        return User.builder()
                .id(doc.getId())
                .username(doc.getUsername())
                .password(doc.getPassword())
                .email(doc.getEmail())
                .rfc(doc.getRfc())
                .roles(doc.getRoles())
                .empresaId(doc.getEmpresaId())
                .build();
    }

    private UserDocument toDocument(User user) {
        return UserDocument.builder()
                .id(user.getId())
                .username(user.getUsername())
                .password(user.getPassword())
                .email(user.getEmail())
                .rfc(user.getRfc())
                .roles(user.getRoles())
                .empresaId(user.getEmpresaId())
                .build();
    }
}
