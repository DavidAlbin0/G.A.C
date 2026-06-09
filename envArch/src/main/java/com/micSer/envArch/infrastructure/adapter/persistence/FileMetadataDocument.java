package com.micSer.envArch.infrastructure.adapter.persistence;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "files_metadata")
public class FileMetadataDocument {
    @Id
    private String id;
    private String fileName;
    private String filePath;
    private long fileSize;
    private String contentType;
    private String userId;
    private LocalDateTime uploadTime;
}
