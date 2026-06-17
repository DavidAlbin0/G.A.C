package com.micSer.envArch.presentation.controller;

import com.micSer.envArch.domain.model.FileMetadata;
import com.micSer.envArch.domain.model.User;
import com.micSer.envArch.domain.repository.UserRepositoryPort;
import com.micSer.envArch.domain.usecase.*;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.micSer.envArch.infrastructure.service.BinaryFileParserService;
import com.micSer.envArch.infrastructure.client.AuditClient;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@Tag(name = "Archivos", description = "Endpoints para la gestión física y lógica de archivos (subir, listar, renombrar, reemplazar, eliminar y descargar)")
@lombok.RequiredArgsConstructor
public class FileController {

    private final UploadFileUseCase uploadFileUseCase;
    private final GetFilesUseCase getFilesUseCase;
    private final RenameFileUseCase renameFileUseCase;
    private final ReplaceFileUseCase replaceFileUseCase;
    private final DeleteFileUseCase deleteFileUseCase;
    private final DownloadFileUseCase downloadFileUseCase;
    private final UserRepositoryPort userRepositoryPort;
    private final BinaryFileParserService binaryFileParserService;
    private final AuditClient auditClient;

    private User getCurrentUser() {
        String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepositoryPort.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (user.getRoles() == null || !user.getRoles().contains("ADMIN")) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado. Solo administradores tienen acceso a GAC.");
        }
        return user;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Subir un nuevo archivo", description = "Guarda físicamente el archivo en el storage y registra sus metadatos en la base de datos.")
    @ApiResponse(responseCode = "200", description = "Archivo subido y registrado exitosamente")
    @ApiResponse(responseCode = "403", description = "Acceso denegado. Rol insuficiente.")
    public ResponseEntity<FileMetadata> uploadFile(
            @RequestParam("file") 
            @Parameter(description = "Archivo físico a subir") MultipartFile file
    ) throws IOException {
        User user = getCurrentUser();
        FileMetadata metadata = uploadFileUseCase.execute(
                file.getOriginalFilename(),
                file.getSize(),
                file.getContentType(),
                user.getId(),
                file.getInputStream()
        );
        auditClient.logEvent(user.getUsername(), "UPLOAD", "Subió archivo: " + metadata.getFileName());
        return ResponseEntity.ok(metadata);
    }

    @GetMapping
    @Operation(summary = "Listar archivos del usuario", description = "Recupera la lista de todos los metadatos de archivos que pertenecen al usuario autenticado.")
    @ApiResponse(responseCode = "200", description = "Lista de metadatos obtenida con éxito")
    @ApiResponse(responseCode = "403", description = "Acceso denegado. Rol insuficiente.")
    public ResponseEntity<List<FileMetadata>> listFiles() {
        User user = getCurrentUser();
        List<FileMetadata> files = getFilesUseCase.execute(user.getId());
        return ResponseEntity.ok(files);
    }

    @PutMapping("/{id}/rename")
    @Operation(summary = "Renombrar archivo", description = "Actualiza el nombre lógico de un archivo por ID, validando que el usuario autenticado sea el propietario.")
    @ApiResponse(responseCode = "200", description = "Archivo renombrado exitosamente")
    @ApiResponse(responseCode = "400", description = "El nombre del archivo es obligatorio o inválido")
    @ApiResponse(responseCode = "403", description = "No autorizado para renombrar el archivo")
    @ApiResponse(responseCode = "404", description = "Archivo no encontrado")
    public ResponseEntity<FileMetadata> renameFile(
            @PathVariable("id") 
            @Parameter(description = "ID único del archivo") String id,
            
            @RequestBody 
            @Parameter(description = "Cuerpo JSON con el nuevo nombre (clave: 'newFileName')") Map<String, String> body
    ) {
        User user = getCurrentUser();
        String newName = body.get("newFileName");
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del archivo es obligatorio");
        }
        FileMetadata updated = renameFileUseCase.execute(id, user.getId(), newName);
        auditClient.logEvent(user.getUsername(), "RENAME", "Renombró archivo ID " + id + " a: " + newName);
        return ResponseEntity.ok(updated);
    }

    @PutMapping(value = "/{id}/replace", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Reemplazar contenido de un archivo", description = "Actualiza el archivo físico en disco y actualiza sus dimensiones/fechas de metadatos en base de datos.")
    @ApiResponse(responseCode = "200", description = "Contenido del archivo reemplazado exitosamente")
    @ApiResponse(responseCode = "403", description = "No autorizado para modificar el archivo")
    @ApiResponse(responseCode = "404", description = "Archivo no encontrado")
    public ResponseEntity<FileMetadata> replaceFile(
            @PathVariable("id") 
            @Parameter(description = "ID del archivo a reemplazar") String id,
            
            @RequestParam("file") 
            @Parameter(description = "Nuevo archivo físico que reemplazará al anterior") MultipartFile file
    ) throws IOException {
        User user = getCurrentUser();
        FileMetadata updated = replaceFileUseCase.execute(
                id,
                user.getId(),
                file.getOriginalFilename(),
                file.getSize(),
                file.getContentType(),
                file.getInputStream()
        );
        auditClient.logEvent(user.getUsername(), "REPLACE", "Reemplazó contenido del archivo: " + updated.getFileName());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar archivo", description = "Borra físicamente el archivo del disco y remueve su registro de metadatos de la base de datos.")
    @ApiResponse(responseCode = "200", description = "Archivo eliminado exitosamente")
    @ApiResponse(responseCode = "403", description = "No autorizado para eliminar el archivo")
    @ApiResponse(responseCode = "404", description = "Archivo no encontrado")
    public ResponseEntity<Map<String, String>> deleteFile(
            @PathVariable("id") 
            @Parameter(description = "ID del archivo a eliminar") String id
    ) {
        User user = getCurrentUser();
        deleteFileUseCase.execute(id, user.getId());
        auditClient.logEvent(user.getUsername(), "DELETE", "Eliminó archivo con ID: " + id);
        return ResponseEntity.ok(Map.of("message", "Archivo eliminado exitosamente"));
    }

    @GetMapping("/{id}/view")
    @Operation(summary = "Descargar o visualizar archivo", description = "Retorna el flujo de bytes del archivo. Si es un archivo binario de sistema (.dat, .isr, .sub, etc.), lo analiza y retorna la estructura analizada en JSON.")
    @ApiResponse(responseCode = "200", description = "Flujo de bytes del archivo o JSON analizado")
    @ApiResponse(responseCode = "403", description = "No autorizado para acceder al archivo")
    @ApiResponse(responseCode = "404", description = "Archivo no encontrado")
    public ResponseEntity<?> viewFile(
            @PathVariable("id") 
            @Parameter(description = "ID del archivo a visualizar o descargar") String id
    ) {
        User user = getCurrentUser();
        InputStream inputStream = downloadFileUseCase.execute(id, user.getId());
        FileMetadata metadata = downloadFileUseCase.getMetadata(id, user.getId());

        String fileName = metadata.getFileName() != null ? metadata.getFileName().toLowerCase() : "";
        String ext = "";
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot != -1) {
            ext = fileName.substring(lastDot + 1);
        }

        if (ext.equals("dat") || ext.equals("isr") || ext.equals("sub") || ext.equals("03") || ext.equals("cre")) {
            byte[] fileBytes;
            try {
                fileBytes = inputStream.readAllBytes();
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Error al leer el contenido del archivo binario"));
            }

            if (ext.equals("dat")) {
                try {
                    Object parsed = binaryFileParserService.parseDatFile(fileBytes);
                    return ResponseEntity.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(parsed);
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("message", "Error al descifrar archivo .dat: " + e.getMessage()));
                }
            } else {
                try {
                    List<Map<String, Object>> parsed = binaryFileParserService.parseVb6File(fileBytes);
                    return ResponseEntity.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(parsed);
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("message", "Error al analizar archivo VB6: " + e.getMessage()));
                }
            }
        }

        InputStreamResource resource = new InputStreamResource(inputStream);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + metadata.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(metadata.getContentType()))
                .body(resource);
    }
}
