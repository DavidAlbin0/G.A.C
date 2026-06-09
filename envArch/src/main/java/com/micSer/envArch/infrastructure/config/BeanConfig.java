package com.micSer.envArch.infrastructure.config;

import com.micSer.envArch.domain.repository.FileRepositoryPort;
import com.micSer.envArch.domain.repository.FileStoragePort;
import com.micSer.envArch.domain.repository.UserRepositoryPort;
import com.micSer.envArch.domain.usecase.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class BeanConfig {

    @Bean
    public LoginUseCase loginUseCase(UserRepositoryPort userRepositoryPort, PasswordEncoder passwordEncoder) {
        return new LoginUseCase(userRepositoryPort, passwordEncoder);
    }

    @Bean
    public RegisterUseCase registerUseCase(UserRepositoryPort userRepositoryPort, PasswordEncoder passwordEncoder) {
        return new RegisterUseCase(userRepositoryPort, passwordEncoder);
    }

    @Bean
    public ChangePasswordUseCase changePasswordUseCase(UserRepositoryPort userRepositoryPort, PasswordEncoder passwordEncoder) {
        return new ChangePasswordUseCase(userRepositoryPort, passwordEncoder);
    }

    @Bean
    public UploadFileUseCase uploadFileUseCase(FileRepositoryPort fileRepositoryPort, FileStoragePort fileStoragePort) {
        return new UploadFileUseCase(fileRepositoryPort, fileStoragePort);
    }

    @Bean
    public GetFilesUseCase getFilesUseCase(FileRepositoryPort fileRepositoryPort) {
        return new GetFilesUseCase(fileRepositoryPort);
    }

    @Bean
    public RenameFileUseCase renameFileUseCase(FileRepositoryPort fileRepositoryPort) {
        return new RenameFileUseCase(fileRepositoryPort);
    }

    @Bean
    public ReplaceFileUseCase replaceFileUseCase(FileRepositoryPort fileRepositoryPort, FileStoragePort fileStoragePort) {
        return new ReplaceFileUseCase(fileRepositoryPort, fileStoragePort);
    }

    @Bean
    public DeleteFileUseCase deleteFileUseCase(FileRepositoryPort fileRepositoryPort, FileStoragePort fileStoragePort) {
        return new DeleteFileUseCase(fileRepositoryPort, fileStoragePort);
    }

    @Bean
    public DownloadFileUseCase downloadFileUseCase(FileRepositoryPort fileRepositoryPort, FileStoragePort fileStoragePort) {
        return new DownloadFileUseCase(fileRepositoryPort, fileStoragePort);
    }
}
