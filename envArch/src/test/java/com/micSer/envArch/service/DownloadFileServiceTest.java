package com.micSer.envArch.service;

import com.micSer.envArch.model.FileMetadata;
import com.micSer.envArch.repository.FileMetadataRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DownloadFileServiceTest {

    @Mock
    private FileMetadataRepository fileMetadataRepository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private DownloadFileService downloadFileService;

    @Test
    void execute_ShouldSucceed_WhenValidInput() {
        String fileId = "file-123";
        String userId = "user-123";
        String filePath = "/uploads/test.txt";

        FileMetadata metadata = FileMetadata.builder()
                .id(fileId)
                .userId(userId)
                .filePath(filePath)
                .build();

        InputStream expectedStream = new ByteArrayInputStream("file content".getBytes());

        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(metadata));
        when(fileStorageService.load(filePath)).thenReturn(expectedStream);

        InputStream actualStream = downloadFileService.execute(fileId, userId);

        assertNotNull(actualStream);
        assertEquals(expectedStream, actualStream);
        verify(fileMetadataRepository, times(1)).findById(fileId);
        verify(fileStorageService, times(1)).load(filePath);
    }

    @Test
    void execute_ShouldThrowRuntimeException_WhenFileNotFound() {
        String fileId = "nonexistent";
        String userId = "user-123";

        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                downloadFileService.execute(fileId, userId)
        );

        assertEquals("Archivo no encontrado", exception.getMessage());
        verify(fileStorageService, never()).load(anyString());
    }

    @Test
    void execute_ShouldThrowSecurityException_WhenUserNotAuthorized() {
        String fileId = "file-123";
        String ownerUserId = "user-owner";
        String unauthorizedUserId = "user-unauthorized";
        String filePath = "/uploads/test.txt";

        FileMetadata metadata = FileMetadata.builder()
                .id(fileId)
                .userId(ownerUserId)
                .filePath(filePath)
                .build();

        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(metadata));

        SecurityException exception = assertThrows(SecurityException.class, () ->
                downloadFileService.execute(fileId, unauthorizedUserId)
        );

        assertEquals("No estás autorizado para acceder a este archivo", exception.getMessage());
        verify(fileStorageService, never()).load(anyString());
    }

    @Test
    void getMetadata_ShouldSucceed_WhenValidInput() {
        String fileId = "file-123";
        String userId = "user-123";

        FileMetadata expectedMetadata = FileMetadata.builder()
                .id(fileId)
                .userId(userId)
                .fileName("test.txt")
                .build();

        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(expectedMetadata));

        FileMetadata actualMetadata = downloadFileService.getMetadata(fileId, userId);

        assertNotNull(actualMetadata);
        assertEquals(expectedMetadata, actualMetadata);
        verify(fileMetadataRepository, times(1)).findById(fileId);
    }

    @Test
    void getMetadata_ShouldThrowRuntimeException_WhenFileNotFound() {
        String fileId = "nonexistent";
        String userId = "user-123";

        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                downloadFileService.getMetadata(fileId, userId)
        );

        assertEquals("Archivo no encontrado", exception.getMessage());
    }

    @Test
    void getMetadata_ShouldThrowSecurityException_WhenUserNotAuthorized() {
        String fileId = "file-123";
        String ownerUserId = "user-owner";
        String unauthorizedUserId = "user-unauthorized";

        FileMetadata metadata = FileMetadata.builder()
                .id(fileId)
                .userId(ownerUserId)
                .build();

        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(metadata));

        SecurityException exception = assertThrows(SecurityException.class, () ->
                downloadFileService.getMetadata(fileId, unauthorizedUserId)
        );

        assertEquals("No estás autorizado para acceder a este archivo", exception.getMessage());
    }
}
