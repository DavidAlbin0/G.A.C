package com.micSer.envArch.service;

import com.micSer.envArch.model.FileMetadata;
import com.micSer.envArch.repository.FileMetadataRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetFilesServiceTest {

    @Mock
    private FileMetadataRepository fileMetadataRepository;

    @InjectMocks
    private GetFilesService getFilesService;

    @Test
    void execute_ShouldReturnFileList_WhenValidInput() {
        String userId = "user-123";
        List<FileMetadata> expectedFiles = List.of(
            FileMetadata.builder().id("file-1").userId(userId).fileName("doc1.pdf").build(),
            FileMetadata.builder().id("file-2").userId(userId).fileName("doc2.png").build()
        );

        when(fileMetadataRepository.findByUserId(userId)).thenReturn(expectedFiles);

        List<FileMetadata> actualFiles = getFilesService.execute(userId);

        assertNotNull(actualFiles);
        assertEquals(2, actualFiles.size());
        assertEquals(expectedFiles, actualFiles);
        verify(fileMetadataRepository, times(1)).findByUserId(userId);
    }
}
