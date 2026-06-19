package com.micSer.envArch.service;

import com.micSer.envArch.model.FileMetadata;
import com.micSer.envArch.repository.FileMetadataRepository;
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
@DisplayName("Pruebas para UploadFileService")
class UploadFileServiceTest {

    @Mock
    private FileMetadataRepository fileMetadataRepository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private UploadFileService uploadFileService;

    @Test
    @DisplayName("Debería subir el archivo físicamente y guardar sus metadatos de forma exitosa")
    void execute_ShouldStoreFileAndSaveMetadataSuccessfully() {
        String fileName = "archivo_prueba.pdf";
        long fileSize = 5000L;
        String contentType = "application/pdf";
        String userId = "user-123";
        InputStream inputStream = new ByteArrayInputStream("contenido simulado".getBytes());
        String expectedStoredPath = "/uploads/user-123/archivo_prueba.pdf";

        when(fileStorageService.store(inputStream, fileName)).thenReturn(expectedStoredPath);

        FileMetadata metadataEsperada = FileMetadata.builder()
                .id("db-id-001")
                .fileName(fileName)
                .filePath(expectedStoredPath)
                .fileSize(fileSize)
                .contentType(contentType)
                .userId(userId)
                .build();
        
        when(fileMetadataRepository.save(any(FileMetadata.class))).thenReturn(metadataEsperada);

        FileMetadata resultado = uploadFileService.execute(fileName, fileSize, contentType, userId, inputStream);

        assertNotNull(resultado);
        assertEquals("db-id-001", resultado.getId());
        assertEquals(fileName, resultado.getFileName());
        assertEquals(expectedStoredPath, resultado.getFilePath());
        assertEquals(fileSize, resultado.getFileSize());
        assertEquals(contentType, resultado.getContentType());
        assertEquals(userId, resultado.getUserId());

        verify(fileStorageService, times(1)).store(inputStream, fileName);
        
        ArgumentCaptor<FileMetadata> metadataCaptor = ArgumentCaptor.forClass(FileMetadata.class);
        verify(fileMetadataRepository, times(1)).save(metadataCaptor.capture());
        
        FileMetadata metadataEnviada = metadataCaptor.getValue();
        assertEquals(fileName, metadataEnviada.getFileName());
        assertEquals(expectedStoredPath, metadataEnviada.getFilePath());
        assertEquals(fileSize, metadataEnviada.getFileSize());
        assertEquals(contentType, metadataEnviada.getContentType());
        assertEquals(userId, metadataEnviada.getUserId());
        assertNotNull(metadataEnviada.getUploadTime(), "La fecha de subida no debe ser nula");
    }
}
