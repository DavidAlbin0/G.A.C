package com.micSer.envArch.domain.usecase;

import com.micSer.envArch.domain.model.FileMetadata;
import com.micSer.envArch.domain.repository.FileRepositoryPort;
import com.micSer.envArch.domain.repository.FileStoragePort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas para UploadFileUseCase")
class UploadFileUseCaseTest {

    @Mock
    private FileRepositoryPort fileRepositoryPort;

    @Mock
    private FileStoragePort fileStoragePort;

    @InjectMocks
    private UploadFileUseCase uploadFileUseCase;

    @Test
    @DisplayName("Debería subir el archivo físicamente y guardar sus metadatos de forma exitosa")
    void execute_ShouldStoreFileAndSaveMetadataSuccessfully() {
        // 1. GIVEN: Datos de entrada y mocks de comportamiento
        String fileName = "archivo_prueba.pdf";
        long fileSize = 5000L;
        String contentType = "application/pdf";
        String userId = "user-123";
        InputStream inputStream = new ByteArrayInputStream("contenido simulado".getBytes());
        String expectedStoredPath = "/uploads/user-123/archivo_prueba.pdf";

        // Simulamos que el almacenamiento físico guarda el archivo y devuelve la ruta
        when(fileStoragePort.store(inputStream, fileName)).thenReturn(expectedStoredPath);

        // Simulamos que al guardar en DB se devuelve el FileMetadata con un ID generado
        FileMetadata metadataEsperada = FileMetadata.builder()
                .id("db-id-001")
                .fileName(fileName)
                .filePath(expectedStoredPath)
                .fileSize(fileSize)
                .contentType(contentType)
                .userId(userId)
                .build();
        
        // Mockeamos el save aceptando cualquier objeto de tipo FileMetadata
        when(fileRepositoryPort.save(any(FileMetadata.class))).thenReturn(metadataEsperada);

        // 2. WHEN: Ejecutamos el caso de uso
        FileMetadata resultado = uploadFileUseCase.execute(fileName, fileSize, contentType, userId, inputStream);

        // 3. THEN: Verificaciones
        assertNotNull(resultado);
        assertEquals("db-id-001", resultado.getId());
        assertEquals(fileName, resultado.getFileName());
        assertEquals(expectedStoredPath, resultado.getFilePath());
        assertEquals(fileSize, resultado.getFileSize());
        assertEquals(contentType, resultado.getContentType());
        assertEquals(userId, resultado.getUserId());

        // Verificamos que se haya interactuado con los puertos (servicios externos)
        verify(fileStoragePort, times(1)).store(inputStream, fileName);
        
        // Usamos un capturador para atrapar el objeto que se le envió al método save()
        ArgumentCaptor<FileMetadata> metadataCaptor = ArgumentCaptor.forClass(FileMetadata.class);
        verify(fileRepositoryPort, times(1)).save(metadataCaptor.capture());
        
        FileMetadata metadataEnviada = metadataCaptor.getValue();
        assertEquals(fileName, metadataEnviada.getFileName());
        assertEquals(expectedStoredPath, metadataEnviada.getFilePath());
        assertEquals(fileSize, metadataEnviada.getFileSize());
        assertEquals(contentType, metadataEnviada.getContentType());
        assertEquals(userId, metadataEnviada.getUserId());
        assertNotNull(metadataEnviada.getUploadTime(), "La fecha de subida no debe ser nula");
    }
}
