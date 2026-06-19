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
@DisplayName("Pruebas para RenameFileService")
class RenameFileServiceTest {

    @Mock
    private FileMetadataRepository fileMetadataRepository;

    @InjectMocks
    private RenameFileService renameFileService;

    @Test
    @DisplayName("Debería lanzar excepción si el archivo no existe en la base de datos")
    void execute_ShouldThrowException_WhenFileNotFound() {
        String fileId = "file-123";
        String userId = "user-abc";
        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.empty());

        RuntimeException excepcion = assertThrows(RuntimeException.class, () -> {
            renameFileService.execute(fileId, userId, "nuevo_nombre.txt");
        });

        assertEquals("Archivo no encontrado", excepcion.getMessage());
        
        verify(fileMetadataRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debería lanzar excepción de seguridad si el usuario no es el dueño del archivo")
    void execute_ShouldThrowSecurityException_WhenUserIsNotOwner() {
        String fileId = "file-123";
        String userId = "user-abc";
        FileMetadata metadata = FileMetadata.builder()
                .id(fileId)
                .userId("user-otro")
                .fileName("archivo_original.txt")
                .build();
        
        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(metadata));

        SecurityException excepcion = assertThrows(SecurityException.class, () -> {
            renameFileService.execute(fileId, userId, "nuevo_nombre.txt");
        });

        assertEquals("No estás autorizado para renombrar este archivo", excepcion.getMessage());
        
        verify(fileMetadataRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debería renombrar el archivo exitosamente cuando el usuario es el dueño y el archivo existe")
    void execute_ShouldRenameFileSuccessfully_WhenUserIsOwnerAndFileExists() {
        String fileId = "file-123";
        String userId = "user-abc";
        String nuevoNombre = "archivo_renombrado.txt";
        
        FileMetadata metadataOriginal = FileMetadata.builder()
                .id(fileId)
                .userId(userId)
                .fileName("archivo_original.txt")
                .build();
        
        FileMetadata metadataGuardado = FileMetadata.builder()
                .id(fileId)
                .userId(userId)
                .fileName(nuevoNombre)
                .build();

        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(metadataOriginal));
        when(fileMetadataRepository.save(metadataOriginal)).thenReturn(metadataGuardado);

        FileMetadata resultado = renameFileService.execute(fileId, userId, nuevoNombre);

        assertNotNull(resultado);
        assertEquals(nuevoNombre, resultado.getFileName());
        assertEquals(nuevoNombre, metadataOriginal.getFileName());
        
        verify(fileMetadataRepository, times(1)).findById(fileId);
        verify(fileMetadataRepository, times(1)).save(metadataOriginal);
    }
}
