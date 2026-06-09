package com.micSer.envArch.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileMetadata {
    private String id;
    private String fileName;
    private String filePath;
    private long fileSize;
    private String contentType;
    private String userId;
    private LocalDateTime uploadTime;
}
