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
class ReplaceFileServiceTest {

    @Mock
    private FileMetadataRepository fileMetadataRepository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private ReplaceFileService replaceFileService;

    @Test
    void execute_ShouldSucceed_WhenValidInput() {
        String fileId = "file-123";
        String userId = "user-123";
        String oldFilePath = "/uploads/old.txt";
        String newFileName = "new.txt";
        String newFilePath = "/uploads/new.txt";
        long newSize = 2000L;
        String contentType = "text/plain";
        InputStream inputStream = new ByteArrayInputStream("new content".getBytes());

        FileMetadata existingMetadata = FileMetadata.builder()
                .id(fileId)
                .userId(userId)
                .filePath(oldFilePath)
                .build();

        FileMetadata savedMetadata = FileMetadata.builder()
                .id(fileId)
                .userId(userId)
                .fileName(newFileName)
                .filePath(newFilePath)
                .fileSize(newSize)
                .contentType(contentType)
                .build();

        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(existingMetadata));
        when(fileStorageService.store(inputStream, newFileName)).thenReturn(newFilePath);
        when(fileMetadataRepository.save(existingMetadata)).thenReturn(savedMetadata);

        FileMetadata result = replaceFileService.execute(fileId, userId, newFileName, newSize, contentType, inputStream);

        assertNotNull(result);
        assertEquals(newFileName, result.getFileName());
        assertEquals(newFilePath, result.getFilePath());
        assertEquals(newSize, result.getFileSize());
        assertEquals(contentType, result.getContentType());

        verify(fileMetadataRepository, times(1)).findById(fileId);
        verify(fileStorageService, times(1)).delete(oldFilePath);
        verify(fileStorageService, times(1)).store(inputStream, newFileName);
        verify(fileMetadataRepository, times(1)).save(existingMetadata);
    }

    @Test
    void execute_ShouldThrowRuntimeException_WhenFileNotFound() {
        String fileId = "nonexistent";
        String userId = "user-123";
        InputStream inputStream = new ByteArrayInputStream("content".getBytes());

        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                replaceFileService.execute(fileId, userId, "file.txt", 100L, "text/plain", inputStream)
        );

        assertEquals("Archivo no encontrado", exception.getMessage());
        verify(fileStorageService, never()).delete(anyString());
        verify(fileStorageService, never()).store(any(), anyString());
    }

    @Test
    void execute_ShouldThrowSecurityException_WhenUserNotAuthorized() {
        String fileId = "file-123";
        String ownerId = "owner";
        String unauthorizedId = "unauthorized";
        InputStream inputStream = new ByteArrayInputStream("content".getBytes());

        FileMetadata existingMetadata = FileMetadata.builder()
                .id(fileId)
                .userId(ownerId)
                .build();

        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(existingMetadata));

        SecurityException exception = assertThrows(SecurityException.class, () ->
                replaceFileService.execute(fileId, unauthorizedId, "file.txt", 100L, "text/plain", inputStream)
        );

        assertEquals("No estás autorizado para modificar este archivo", exception.getMessage());
        verify(fileStorageService, never()).delete(anyString());
        verify(fileStorageService, never()).store(any(), anyString());
    }
}
