package com.micSer.envArch.domain.usecase;

import com.micSer.envArch.domain.repository.FileRepositoryPort;
import com.micSer.envArch.domain.repository.FileStoragePort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeleteFileUseCaseTest {

    @Mock
    private FileRepositoryPort fileRepositoryPort;

    @Mock
    private FileStoragePort fileStoragePort;

    @InjectMocks
    private DeleteFileUseCase deleteFileUseCase;

    @Test
    void execute_ShouldSucceed_WhenValidInput() {
        // TODO: Implement unit test for DeleteFileUseCase
    }
}
