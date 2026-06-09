package com.micSer.xmlends.infrastructure.service;

import com.micSer.xmlends.domain.model.ContenidoXml;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class XmlValidatorService {

    private final SatValidationService satValidationService;
    private final GeminiValidationService geminiValidationService;

    public XmlValidatorService(
            SatValidationService satValidationService,
            GeminiValidationService geminiValidationService) {
        this.satValidationService = satValidationService;
        this.geminiValidationService = geminiValidationService;
    }

    public ValidationResult validateInvoice(XmlParserService.ParsedXmlData xmlData) {
        ContenidoXml content = xmlData.contenidoXml;
        
        // 1. Validar contra el SAT usando el UUID
        String satStatus = satValidationService.validateUuid(
                xmlData.uuid,
                content.getRfcEmisor(),
                content.getRfcReceptor(),
                content.getTotal()
        );
        
        if ("Cancelado".equalsIgnoreCase(satStatus)) {
            return new ValidationResult("NO_VALIDO", "La factura está cancelada en el SAT.");
        }
        
        if (!"Vigente".equalsIgnoreCase(satStatus) && !"Cancelado".equalsIgnoreCase(satStatus)) {
            return new ValidationResult("REVISION", "Validación SAT: " + satStatus);
        }
        
        // 2. Validar que la fecha no esté en el futuro
        if (content.getFechaTimbrado().isAfter(LocalDateTime.now().plusDays(1))) {
            return new ValidationResult("NO_VALIDO", "La fecha de timbrado de la factura está en el futuro.");
        }
        
        // 3. Validar Conceptos con Inteligencia Artificial (Gemini)
        if (geminiValidationService.isConfigured()) {
            GeminiValidationService.GeminiResult geminiResult = geminiValidationService.validateInvoice(
                    content.getNombreEmisor(),
                    xmlData.concepto,
                    content.getTotal(),
                    content.getMoneda()
            );
            if (geminiResult != null) {
                return new ValidationResult(geminiResult.getStatus(), geminiResult.getMotivo());
            }
        }
        
        // 4. Fallback: Validar Conceptos mediante Reglas Manuales
        String conceptoLower = xmlData.concepto.toLowerCase();
        
        // Palabras clave para comidas (Revisión manual)
        if (conceptoLower.contains("comida") || 
            conceptoLower.contains("alimento") || 
            conceptoLower.contains("restaurante") || 
            conceptoLower.contains("consumo") || 
            conceptoLower.contains("desayuno") || 
            conceptoLower.contains("cena") || 
            conceptoLower.contains("propina") ||
            conceptoLower.contains("café") ||
            conceptoLower.contains("cafe")) {
            
            return new ValidationResult("REVISION", "El concepto requiere revisión manual de administración (Alimentos/Gastos de representación).");
        }
        
        // Si no cumple ningún filtro negativo y el SAT está vigente, se pasa a listo para validar
        return new ValidationResult("LISTO_PARA_VALIDAR", "Factura pre-aprobada (vigente en el SAT y concepto permitido). Requiere validación manual.");
    }

    public static class ValidationResult {
        public final String status;
        public final String motivo;

        public ValidationResult(String status, String motivo) {
            this.status = status;
            this.motivo = motivo;
        }
    }
}
