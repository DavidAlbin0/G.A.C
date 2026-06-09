package com.micSer.xmlends.presentation.controller;

import com.micSer.xmlends.domain.model.Ejercicio;
import com.micSer.xmlends.domain.model.Factura;
import com.micSer.xmlends.domain.model.UserDetail;
import com.micSer.xmlends.domain.repository.EjercicioRepositoryPort;
import com.micSer.xmlends.domain.repository.FacturaRepositoryPort;
import com.micSer.xmlends.domain.repository.UserServiceClientPort;
import com.micSer.xmlends.domain.repository.EmailSenderPort;
import com.micSer.xmlends.infrastructure.security.UserPrincipal;
import com.micSer.xmlends.infrastructure.service.FileStorageService;
import com.micSer.xmlends.infrastructure.service.XmlParserService;
import com.micSer.xmlends.infrastructure.service.XmlValidatorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/xmlends")
public class XmlendsController {

    private final FileStorageService fileStorageService;
    private final XmlParserService xmlParserService;
    private final XmlValidatorService xmlValidatorService;
    private final EjercicioRepositoryPort ejercicioRepository;
    private final FacturaRepositoryPort facturaRepository;
    private final UserServiceClientPort userServiceClient;
    private final EmailSenderPort emailSender;

    public XmlendsController(
            FileStorageService fileStorageService,
            XmlParserService xmlParserService,
            XmlValidatorService xmlValidatorService,
            EjercicioRepositoryPort ejercicioRepository,
            FacturaRepositoryPort facturaRepository,
            UserServiceClientPort userServiceClient,
            EmailSenderPort emailSender) {
        this.fileStorageService = fileStorageService;
        this.xmlParserService = xmlParserService;
        this.xmlValidatorService = xmlValidatorService;
        this.ejercicioRepository = ejercicioRepository;
        this.facturaRepository = facturaRepository;
        this.userServiceClient = userServiceClient;
        this.emailSender = emailSender;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFiles(
            @RequestParam("xml") MultipartFile xmlFile,
            @RequestParam("pdf") MultipartFile pdfFile,
            @RequestParam("ejercicioId") String ejercicioId,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (principal == null || principal.getRoles() == null || !principal.getRoles().contains("USER_REMB")) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado. Solo usuarios de tipo reembolso pueden cargar facturas.");
        }

        if (xmlFile.isEmpty() || pdfFile.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ambos archivos (XML y PDF) son obligatorios"));
        }

        String xmlName = xmlFile.getOriginalFilename();
        String pdfName = pdfFile.getOriginalFilename();
        if (xmlName == null || !xmlName.toLowerCase().endsWith(".xml")) {
            return ResponseEntity.badRequest().body(Map.of("message", "El archivo XML debe tener extensión .xml"));
        }
        if (pdfName == null || !pdfName.toLowerCase().endsWith(".pdf")) {
            return ResponseEntity.badRequest().body(Map.of("message", "El archivo PDF debe tener extensión .pdf"));
        }
        
        String xmlBaseName = xmlName.substring(0, xmlName.lastIndexOf('.'));
        String pdfBaseName = pdfName.substring(0, pdfName.lastIndexOf('.'));
        if (!xmlBaseName.equalsIgnoreCase(pdfBaseName)) {
            return ResponseEntity.badRequest().body(Map.of("message", "El archivo XML y PDF deben tener exactamente el mismo nombre."));
        }

        try {
            // 1. Parsear el archivo XML
            XmlParserService.ParsedXmlData parsedData = xmlParserService.parseXml(xmlFile);

            // 2. Correr las reglas del Semáforo
            XmlValidatorService.ValidationResult validationResult = xmlValidatorService.validateInvoice(parsedData);

            // 3. Guardar archivos físicamente
            String xmlSavedPath = fileStorageService.storeFile(xmlFile, parsedData.uuid, ".xml");
            String pdfSavedPath = fileStorageService.storeFile(pdfFile, parsedData.uuid, ".pdf");

            String rechazadoPor = null;
            if ("NO_VALIDO".equalsIgnoreCase(validationResult.status)) {
                rechazadoPor = "ia@xmlends.com";
            }

            // 4. Crear y guardar la factura
            Factura factura = Factura.builder()
                    .id(parsedData.uuid == null || parsedData.uuid.isEmpty() ? UUID.randomUUID().toString() : parsedData.uuid)
                    .tipoFactura(parsedData.contenidoXml.getUsoCFDI())
                    .concepto(parsedData.concepto)
                    .fechaFactura(parsedData.fechaFactura)
                    .fechaRegistro(LocalDateTime.now())
                    .xmlPath(xmlSavedPath)
                    .pdfPath(pdfSavedPath)
                    .fileName(xmlName)
                    .status(validationResult.status)
                    .statusMotivo(validationResult.motivo)
                    .userID(principal.getId())
                    .userName(principal.getUsername())
                    .empresaID(principal.getEmpresaId())
                    .ejercicioID(ejercicioId)
                    .rechazadoPorEmail(rechazadoPor)
                    .contenidoXml(parsedData.contenidoXml)
                    .build();

            Factura saved = facturaRepository.save(factura);

            return ResponseEntity.status(HttpStatus.CREATED).body(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error al procesar la carga: " + e.getMessage()));
        }
    }

    @GetMapping("/mis-facturas")
    public ResponseEntity<List<Factura>> getMisFacturas(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(facturaRepository.findByUserID(principal.getId()));
    }

    @GetMapping("/ejercicios")
    public ResponseEntity<List<Ejercicio>> getEjercicios(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (principal.getRoles().contains("ADMIN_GEN")) {
            return ResponseEntity.ok(ejercicioRepository.findAll());
        }
        if (principal.getRoles().contains("ADMIN")) {
            return ResponseEntity.ok(ejercicioRepository.findByEmpresaID(principal.getEmpresaId()));
        }
        if (principal.getRoles().contains("USER_REMB")) {
            return ResponseEntity.ok(ejercicioRepository.findByUserPropietario(principal.getId()));
        }
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/ejercicios")
    public ResponseEntity<Ejercicio> createEjercicio(
            @RequestBody Ejercicio ejercicio,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getRoles() == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        boolean isAdminGen = principal.getRoles().contains("ADMIN_GEN");
        boolean isAdmin = principal.getRoles().contains("ADMIN");
        boolean isUser = principal.getRoles().contains("USER_REMB");

        if (!isAdminGen && !isAdmin && !isUser) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado");
        }

        // Auto-set dates to current month bounds
        ejercicio.setFechaInicio(LocalDate.now().withDayOfMonth(1));
        ejercicio.setFechaFin(LocalDate.now().with(TemporalAdjusters.lastDayOfMonth()));

        if (isUser) {
            ejercicio.setUserPropietario(principal.getId());
            ejercicio.setUserAdmin(null);
            ejercicio.setEmpresaID(principal.getEmpresaId());
        } else {
            if (ejercicio.getUserAdmin() == null) {
                ejercicio.setUserAdmin(principal.getId());
            }

            // Resolve company ID based on owner user
            String owner = ejercicio.getUserPropietario();
            if (owner != null && !owner.isEmpty()) {
                Optional<UserDetail> ownerDetail = userServiceClient.getUserByIdOrUsername(owner);
                if (ownerDetail.isPresent()) {
                    ejercicio.setEmpresaID(ownerDetail.get().getEmpresaId());
                } else {
                    ejercicio.setEmpresaID(principal.getEmpresaId());
                }
            } else {
                ejercicio.setEmpresaID(principal.getEmpresaId());
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(ejercicioRepository.save(ejercicio));
    }

    @GetMapping("/admin/resumen")
    public ResponseEntity<?> getAdminResumen(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getRoles() == null || 
            (!principal.getRoles().contains("ADMIN") && !principal.getRoles().contains("ADMIN_GEN"))) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado");
        }

        List<Factura> facturas;
        if (principal.getRoles().contains("ADMIN_GEN")) {
            facturas = facturaRepository.findAll();
        } else {
            facturas = facturaRepository.findByEmpresaID(principal.getEmpresaId());
        }
        
        long totalFacturas = facturas.size();
        long validas = facturas.stream().filter(f -> "VALIDO".equalsIgnoreCase(f.getStatus())).count();
        long noValidas = facturas.stream().filter(f -> "NO_VALIDO".equalsIgnoreCase(f.getStatus())).count();
        long revision = facturas.stream().filter(f -> "REVISION".equalsIgnoreCase(f.getStatus())).count();
        
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        long subidosMes = facturas.stream()
                .filter(f -> f.getFechaRegistro() != null && f.getFechaRegistro().isAfter(startOfMonth))
                .count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalFacturas", totalFacturas);
        summary.put("validas", validas);
        summary.put("noValidas", noValidas);
        summary.put("revision", revision);
        summary.put("subidasEsteMes", subidosMes);
        summary.put("facturas", facturas);

        return ResponseEntity.ok(summary);
    }

    @DeleteMapping("/factura/{id}")
    public ResponseEntity<?> deleteFactura(@PathVariable String id, @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getRoles() == null || !principal.getRoles().contains("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Acceso denegado"));
        }
        
        return facturaRepository.findById(id).map(factura -> {
            fileStorageService.deleteFile(factura.getXmlPath());
            fileStorageService.deleteFile(factura.getPdfPath());
            facturaRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/factura/{id}/revisar")
    public ResponseEntity<?> revisarFactura(
            @PathVariable String id, 
            @RequestBody Map<String, Object> payload, 
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getRoles() == null || 
            (!principal.getRoles().contains("ADMIN") && !principal.getRoles().contains("ADMIN_GEN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Acceso denegado"));
        }
        
        return facturaRepository.findById(id).map(factura -> {
            if (payload.containsKey("status")) {
                String newStatus = (String) payload.get("status");
                factura.setStatus(newStatus);
                if ("NO_VALIDO".equalsIgnoreCase(newStatus)) {
                    factura.setRechazadoPorEmail(principal.getEmail());
                } else if ("VALIDO".equalsIgnoreCase(newStatus)) {
                    factura.setRechazadoPorEmail(null);
                    factura.setApelado(false);
                    factura.setApelacionDenegada(false);
                } else {
                    factura.setRechazadoPorEmail(null);
                }
            }
            if (payload.containsKey("motivo")) {
                factura.setStatusMotivo((String) payload.get("motivo"));
            }
            if (payload.containsKey("apelacionDenegada")) {
                Boolean denegada = (Boolean) payload.get("apelacionDenegada");
                if (denegada != null && denegada) {
                    factura.setApelacionDenegada(true);
                    factura.setApelado(false);
                    factura.setStatus("NO_VALIDO");
                }
            }
            if (payload.containsKey("ejercicioID")) factura.setEjercicioID((String) payload.get("ejercicioID"));
            
            Factura updated = facturaRepository.save(factura);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/factura/{id}/apelar")
    public ResponseEntity<?> apelarFactura(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return facturaRepository.findById(id).map(factura -> {
            if (!factura.getUserID().equals(principal.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "No tienes permisos para apelar esta factura."));
            }

            if (!"NO_VALIDO".equalsIgnoreCase(factura.getStatus())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Solo se pueden apelar facturas rechazadas."));
            }

            if (factura.isApelacionDenegada()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "La apelación para esta factura ya ha sido denegada permanentemente."));
            }

            String justificacion = (payload != null && payload.containsKey("justificacion")) 
                    ? payload.get("justificacion") 
                    : "Sin justificación adicional.";

            factura.setApelado(true);
            factura.setJustificacionApelacion(justificacion);
            factura.setApelacionDenegada(false);

            facturaRepository.save(factura);

            return ResponseEntity.ok(Map.of(
                    "message", "Apelación registrada con éxito.",
                    "apelado", true
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/factura/{id}")
    public ResponseEntity<Factura> getFactura(@PathVariable String id, @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getRoles() == null || 
            (!principal.getRoles().contains("ADMIN") && !principal.getRoles().contains("ADMIN_GEN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return facturaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/factura/{id}/reemplazar")
    public ResponseEntity<?> reemplazarFactura(
            @PathVariable String id,
            @RequestParam("xml") MultipartFile xmlFile,
            @RequestParam("pdf") MultipartFile pdfFile,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        if (principal == null || principal.getRoles() == null || !principal.getRoles().contains("USER_REMB")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Acceso denegado"));
        }

        return facturaRepository.findById(id).map(factura -> {
            if (!factura.getUserID().equals(principal.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "No tienes permisos para esta acción"));
            }

            if ("VALIDO".equalsIgnoreCase(factura.getStatus())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "No se puede reemplazar una factura que ya es válida."));
            }

            if (xmlFile.isEmpty() || pdfFile.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Ambos archivos (XML y PDF) son obligatorios"));
            }

            String xmlName = xmlFile.getOriginalFilename();
            String pdfName = pdfFile.getOriginalFilename();
            if (xmlName == null || !xmlName.toLowerCase().endsWith(".xml")) {
                return ResponseEntity.badRequest().body(Map.of("message", "El archivo XML debe tener extensión .xml"));
            }
            if (pdfName == null || !pdfName.toLowerCase().endsWith(".pdf")) {
                return ResponseEntity.badRequest().body(Map.of("message", "El archivo PDF debe tener extensión .pdf"));
            }
            
            String xmlBaseName = xmlName.substring(0, xmlName.lastIndexOf('.'));
            String pdfBaseName = pdfName.substring(0, pdfName.lastIndexOf('.'));
            if (!xmlBaseName.equalsIgnoreCase(pdfBaseName)) {
                return ResponseEntity.badRequest().body(Map.of("message", "El archivo XML y PDF deben tener exactamente el mismo nombre."));
            }

            try {
                // Parse new XML and validate
                XmlParserService.ParsedXmlData parsedData = xmlParserService.parseXml(xmlFile);
                XmlValidatorService.ValidationResult validationResult = xmlValidatorService.validateInvoice(parsedData);

                // Delete old files from storage
                fileStorageService.deleteFile(factura.getXmlPath());
                fileStorageService.deleteFile(factura.getPdfPath());

                // Store new files physically
                String xmlSavedPath = fileStorageService.storeFile(xmlFile, parsedData.uuid, ".xml");
                String pdfSavedPath = fileStorageService.storeFile(pdfFile, parsedData.uuid, ".pdf");

                String rechazadoPor = null;
                if ("NO_VALIDO".equalsIgnoreCase(validationResult.status)) {
                    rechazadoPor = "ia@xmlends.com";
                }

                // Update factura fields
                factura.setTipoFactura(parsedData.contenidoXml.getUsoCFDI());
                factura.setConcepto(parsedData.concepto);
                factura.setFechaFactura(parsedData.fechaFactura);
                factura.setXmlPath(xmlSavedPath);
                factura.setPdfPath(pdfSavedPath);
                factura.setFileName(xmlName);
                factura.setStatus(validationResult.status);
                factura.setStatusMotivo(validationResult.motivo);
                factura.setContenidoXml(parsedData.contenidoXml);
                
                // Reset appeal flags
                factura.setApelado(false);
                factura.setJustificacionApelacion(null);
                factura.setApelacionDenegada(false);
                factura.setRechazadoPorEmail(rechazadoPor);

                Factura saved = facturaRepository.save(factura);
                return ResponseEntity.ok(saved);

            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Error al procesar el reemplazo: " + e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }
}
