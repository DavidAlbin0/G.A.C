package com.micSer.envArch.domain.usecase;

import com.micSer.envArch.domain.repository.FileRepositoryPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RenameFileUseCaseTest {

    @Mock
    private FileRepositoryPort fileRepositoryPort;

    @InjectMocks
    private RenameFileUseCase renameFileUseCase;

    @Test
    void execute_ShouldSucceed_WhenValidInput() {
        // TODO: Implement unit test for RenameFileUseCase
    }
}
