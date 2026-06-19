package com.micSer.envArch.service;

import com.micSer.envArch.model.FileMetadata;
import com.micSer.envArch.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GetFilesService {

    private final FileMetadataRepository fileMetadataRepository;

    public List<FileMetadata> execute(String userId) {
        return fileMetadataRepository.findByUserId(userId);
    }
}
