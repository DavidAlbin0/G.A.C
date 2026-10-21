package com.micSer.envArch.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadPath;

    public FileStorageService(@Value("${app.upload.dir}") String uploadDir) {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo crear el directorio de subidas", e);
        }
    }

    public String store(InputStream inputStream, String fileName) {
        try {
            String cleanFileName = Paths.get(fileName).getFileName().toString();
            String lowerName = cleanFileName.toLowerCase();
            
            // Subcarpeta según el tipo de archivo (en minúsculas para coincidir con el VPS)
            Path subDir;
            if (lowerName.matches(".*\\.(03|cre|isr|sub)$")) {
                subDir = this.uploadPath.resolve("tarifas");
            } else if (lowerName.matches(".*\\.(10|200|94)$")) {
                subDir = this.uploadPath.resolve("indices");
            } else if (lowerName.endsWith(".exe")) {
                String appFolder = resolveAppFolder(lowerName);
                subDir = this.uploadPath.resolve("aplicaciones").resolve(appFolder);
            } else {
                subDir = this.uploadPath;
            }
            
            Files.createDirectories(subDir);
            String uniqueName = UUID.randomUUID().toString() + "_" + cleanFileName;
            Path targetLocation = subDir.resolve(uniqueName);
            
            if (!targetLocation.startsWith(this.uploadPath)) {
                throw new RuntimeException("Intento de directory traversal detectado para el archivo: " + fileName);
            }
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return targetLocation.toString();
        } catch (IOException e) {
            throw new RuntimeException("Error al almacenar el archivo físicamente: " + fileName, e);
        }
    }

    private String resolveAppFolder(String lowerName) {
        if (lowerName.contains("nomina")) {
            return "NOMINA";
        } else if (lowerName.contains("depre")) {
            return "DEPRECIACION";
        } else if (lowerName.contains("acumulado") || lowerName.contains("acunom")) {
            return "ACUMULADO";
        } else if (lowerName.contains("auxiliar")) {
            return "AUXILIARES";
        } else if (lowerName.contains("captura")) {
            return "CAPTURA";
        } else if (lowerName.contains("controlavc") || lowerName.contains("cltav")) {
            return "CONTROLAVC";
        }
        int dotIndex = lowerName.lastIndexOf('.');
        String baseName = (dotIndex > 0) ? lowerName.substring(0, dotIndex) : lowerName;
        return baseName.toUpperCase();
    }

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

    public InputStream load(String filePath) {
        try {
            Path targetFile = resolveFilePath(filePath);

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

    private Path resolveFilePath(String filePath) {
        Path target = Paths.get(filePath).toAbsolutePath().normalize();
        if (Files.exists(target)) {
            return target;
        }

        String fileName = target.getFileName().toString();
        Path candidate = this.uploadPath.resolve(fileName).toAbsolutePath().normalize();
        if (Files.exists(candidate)) {
            return candidate;
        }

        String[] subDirs = {"tarifas", "TARIFAS", "indices", "INDICES", "aplicaciones", "APLICACIONES"};
        for (String sub : subDirs) {
            Path p = this.uploadPath.resolve(sub).resolve(fileName).toAbsolutePath().normalize();
            if (Files.exists(p)) {
                return p;
            }
        }

        try (var stream = Files.walk(this.uploadPath, 4)) {
            var found = stream.filter(Files::isRegularFile)
                    .filter(p -> {
                        String name = p.getFileName().toString();
                        return name.equalsIgnoreCase(fileName)
                                || name.toLowerCase().endsWith("_" + fileName.toLowerCase());
                    })
                    .findFirst();
            if (found.isPresent()) {
                return found.get();
            }
        } catch (IOException ignored) {
        }

        return target;
    }
}
