package com.micSer.envArch.domain.usecase;

import com.micSer.envArch.domain.model.FileMetadata;
import com.micSer.envArch.domain.repository.FileRepositoryPort;

import java.util.List;

public class GetFilesUseCase {

    private final FileRepositoryPort fileRepositoryPort;

    public GetFilesUseCase(FileRepositoryPort fileRepositoryPort) {
        this.fileRepositoryPort = fileRepositoryPort;
    }

    public List<FileMetadata> execute(String userId) {
        return fileRepositoryPort.findByUserId(userId);
    }
}
