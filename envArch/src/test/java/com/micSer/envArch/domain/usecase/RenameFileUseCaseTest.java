package com.micSer.envArch.domain.usecase;

import com.micSer.envArch.domain.model.FileMetadata;
import com.micSer.envArch.domain.repository.FileRepositoryPort;
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
@DisplayName("Pruebas para RenameFileUseCase")
class RenameFileUseCaseTest {

    @Mock
    private FileRepositoryPort fileRepositoryPort;

    @InjectMocks
    private RenameFileUseCase renameFileUseCase;

    @Test
    @DisplayName("Debería lanzar excepción si el archivo no existe en la base de datos")
    void execute_ShouldThrowException_WhenFileNotFound() {
        // GIVEN: El ID del archivo no existe en el repositorio
        String fileId = "file-123";
        String userId = "user-abc";
        when(fileRepositoryPort.findById(fileId)).thenReturn(Optional.empty());

        // WHEN & THEN: Verificamos que lance RuntimeException
        RuntimeException excepcion = assertThrows(RuntimeException.class, () -> {
            renameFileUseCase.execute(fileId, userId, "nuevo_nombre.txt");
        });

        assertEquals("Archivo no encontrado", excepcion.getMessage());
        
        // Verificamos que NUNCA intentó guardar nada
        verify(fileRepositoryPort, never()).save(any());
    }

    @Test
    @DisplayName("Debería lanzar excepción de seguridad si el usuario no es el dueño del archivo")
    void execute_ShouldThrowSecurityException_WhenUserIsNotOwner() {
        // GIVEN: El archivo existe pero pertenece a otro usuario ("user-otro")
        String fileId = "file-123";
        String userId = "user-abc";
        FileMetadata metadata = FileMetadata.builder()
                .id(fileId)
                .userId("user-otro") // Dueño diferente
                .fileName("archivo_original.txt")
                .build();
        
        when(fileRepositoryPort.findById(fileId)).thenReturn(Optional.of(metadata));

        // WHEN & THEN: Verificamos que lance SecurityException
        SecurityException excepcion = assertThrows(SecurityException.class, () -> {
            renameFileUseCase.execute(fileId, userId, "nuevo_nombre.txt");
        });

        assertEquals("No estás autorizado para renombrar este archivo", excepcion.getMessage());
        
        // Verificamos que NUNCA se guardó el archivo renombrado
        verify(fileRepositoryPort, never()).save(any());
    }

    @Test
    @DisplayName("Debería renombrar el archivo exitosamente cuando el usuario es el dueño y el archivo existe")
    void execute_ShouldRenameFileSuccessfully_WhenUserIsOwnerAndFileExists() {
        // GIVEN: El archivo existe y el usuario es el dueño
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

        when(fileRepositoryPort.findById(fileId)).thenReturn(Optional.of(metadataOriginal));
        when(fileRepositoryPort.save(metadataOriginal)).thenReturn(metadataGuardado);

        // WHEN: Ejecutamos el caso de uso
        FileMetadata resultado = renameFileUseCase.execute(fileId, userId, nuevoNombre);

        // THEN: Verificaciones
        assertNotNull(resultado);
        assertEquals(nuevoNombre, resultado.getFileName());
        
        // Verificamos que se haya modificado la instancia original antes de guardar
        assertEquals(nuevoNombre, metadataOriginal.getFileName());
        
        // Verificamos que se haya llamado a findById y a save exactamente una vez
        verify(fileRepositoryPort, times(1)).findById(fileId);
        verify(fileRepositoryPort, times(1)).save(metadataOriginal);
    }
}
