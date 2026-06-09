package com.micSer.envArch.domain.repository;

import java.io.InputStream;

public interface FileStoragePort {
    String store(InputStream inputStream, String fileName);
    void delete(String filePath);
    InputStream load(String filePath);
}
