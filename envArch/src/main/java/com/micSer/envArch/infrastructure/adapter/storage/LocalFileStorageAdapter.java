package com.micSer.envArch.infrastructure.adapter.storage;

import com.micSer.envArch.domain.repository.FileStoragePort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Component
public class LocalFileStorageAdapter implements FileStoragePort {

    private final Path uploadPath;

    public LocalFileStorageAdapter(@Value("${app.upload.dir}") String uploadDir) {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo crear el directorio de subidas", e);
        }
    }

    @Override
    public String store(InputStream inputStream, String fileName) {
        try {
            String cleanFileName = Paths.get(fileName).getFileName().toString();
            String uniqueName = UUID.randomUUID().toString() + "_" + cleanFileName;
            Path targetLocation = this.uploadPath.resolve(uniqueName);
            
            if (!targetLocation.startsWith(this.uploadPath)) {
                throw new RuntimeException("Intento de directory traversal detectado para el archivo: " + fileName);
            }

            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return targetLocation.toString();
        } catch (IOException e) {
            throw new RuntimeException("Error al almacenar el archivo físicamente: " + fileName, e);
        }
    }

    @Override
    public void delete(String filePath) {
        try {
            Path fileToDelete = Paths.get(filePath).toAbsolutePath().normalize();
            if (fileToDelete.startsWith(this.uploadPath)) {
                Files.deleteIfExists(fileToDelete);
            }
        } catch (IOException e) {
            throw new RuntimeException("Error al eliminar el archivo físico: " + filePath, e);
        }
    }

    @Override
    public InputStream load(String filePath) {
        try {
            Path targetFile = Paths.get(filePath).toAbsolutePath().normalize();
            
            // Try to find the file in the currently configured uploads directory first
            String fileName = targetFile.getFileName().toString();
            Path localFile = this.uploadPath.resolve(fileName).toAbsolutePath().normalize();
            if (Files.exists(localFile)) {
                targetFile = localFile;
            }

            // Safety check against directory traversal
            if (targetFile.toString().contains("..")) {
                throw new SecurityException("Intento de directory traversal detectado: " + filePath);
            }

            if (!Files.exists(targetFile)) {
                throw new RuntimeException("El archivo físico no existe en: " + targetFile.toAbsolutePath());
            }
            return Files.newInputStream(targetFile);
        } catch (IOException e) {
            throw new RuntimeException("Error al cargar el archivo físico: " + filePath, e);
        }
    }
}
