package com.micSer.envArch.service;

import com.micSer.envArch.model.FileMetadata;
import com.micSer.envArch.repository.FileMetadataRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas para DeleteFileService")
class DeleteFileServiceTest {

    @Mock
    private FileMetadataRepository fileMetadataRepository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private DeleteFileService deleteFileService;

    @Test
    @DisplayName("Debería lanzar excepción si el archivo a eliminar no existe")
    void execute_ShouldThrowException_WhenFileNotFound() {
        String fileId = "file-123";
        String userId = "user-abc";
        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.empty());

        RuntimeException excepcion = assertThrows(RuntimeException.class, () -> {
            deleteFileService.execute(fileId, userId);
        });

        assertEquals("Archivo no encontrado", excepcion.getMessage());

        verify(fileStorageService, never()).delete(anyString());
        verify(fileMetadataRepository, never()).deleteById(anyString());
    }

    @Test
    @DisplayName("Debería lanzar excepción de seguridad si el usuario no es el dueño del archivo")
    void execute_ShouldThrowSecurityException_WhenUserIsNotOwner() {
        String fileId = "file-123";
        String userId = "user-abc";
        FileMetadata metadata = FileMetadata.builder()
                .id(fileId)
                .userId("user-otro")
                .filePath("/uploads/user-otro/test.txt")
                .build();

        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(metadata));

        SecurityException excepcion = assertThrows(SecurityException.class, () -> {
            deleteFileService.execute(fileId, userId);
        });

        assertEquals("No estás autorizado para eliminar este archivo", excepcion.getMessage());

        verify(fileStorageService, never()).delete(anyString());
        verify(fileMetadataRepository, never()).deleteById(anyString());
    }

    @Test
    @DisplayName("Debería eliminar el archivo física y lógicamente de forma exitosa")
    void execute_ShouldDeleteFileSuccessfully_WhenUserIsOwnerAndFileExists() {
        String fileId = "file-123";
        String userId = "user-abc";
        String filePath = "/uploads/user-abc/test.txt";
        FileMetadata metadata = FileMetadata.builder()
                .id(fileId)
                .userId(userId)
                .filePath(filePath)
                .build();

        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(metadata));

        assertDoesNotThrow(() -> deleteFileService.execute(fileId, userId));

        verify(fileMetadataRepository, times(1)).findById(fileId);
        verify(fileStorageService, times(1)).delete(filePath);
        verify(fileMetadataRepository, times(1)).deleteById(fileId);
    }
}
