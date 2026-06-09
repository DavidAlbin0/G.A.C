package com.micSer.xmlends.infrastructure.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiValidationService {

    private static final Logger log = LoggerFactory.getLogger(GeminiValidationService.class);

    private final String apiUrl;
    private final String apiKey;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiValidationService(
            @Value("${app.gemini.url}") String apiUrl,
            @Value("${app.gemini.key:}") String apiKey) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    public GeminiResult validateInvoice(String emisor, String concepto, BigDecimal total, String moneda) {
        if (!isConfigured()) {
            log.info("Gemini API Key no configurada. Saltando validación por IA (fallback activado).");
            return null;
        }

        try {
            String url = apiUrl + "?key=" + apiKey;

            String prompt = String.format(
                "Decide si esta factura de gastos debe ser pre-aprobada (status: LISTO_PARA_VALIDAR) o rechazada automáticamente (status: NO_VALIDO) o enviada a revisión manual (status: REVISION).\n\n" +
                "Reglas de negocio:\n" +
                "- Gastos de alimentos/comida/restaurante razonables son pre-aprobados (máximo $1000 MXN en total, o si parece razonable para una comida de trabajo de varias personas).\n" +
                "- Gastos de alimentos excesivos (por ejemplo, comidas de más de $1500 MXN por persona, o un total de más de $3000 MXN en alimentos que parezca desproporcionado para consumo normal de 1 o 2 personas) deben ser rechazados automáticamente (NO_VALIDO) con un motivo claro (ej. 'Consumo excesivo en restaurante').\n" +
                "- Gastos de alcohol, botellas de vino de alto valor, cigarros o conceptos no relacionados con trabajo deben ser rechazados (NO_VALIDO).\n" +
                "- Si no estás seguro o parece requerir criterio humano, clasifícalo como REVISION.\n" +
                "- Cualquier otro gasto normal y legítimo (papelería, transporte, etc.) debe ser LISTO_PARA_VALIDAR.\n\n" +
                "Factura:\n" +
                "Emisor: %s\n" +
                "Conceptos: %s\n" +
                "Total: %s %s\n\n" +
                "Responde estrictamente en formato JSON con la siguiente estructura:\n" +
                "{\n" +
                "  \"status\": \"LISTO_PARA_VALIDAR\" | \"NO_VALIDO\" | \"REVISION\",\n" +
                "  \"motivo\": \"Explicación breve de la decisión en español\"\n" +
                "}",
                emisor, concepto, total != null ? total.toString() : "0.0", moneda != null ? moneda : "MXN"
            );

            // Estructura de la petición
            Map<String, Object> requestBody = new HashMap<>();
            
            // Contents -> Parts -> Text
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);
            
            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(textPart));
            requestBody.put("contents", List.of(content));

            // GenerationConfig con ResponseSchema para JSON estructurado
            Map<String, Object> genConfig = new HashMap<>();
            genConfig.put("responseMimeType", "application/json");

            Map<String, Object> responseSchema = new HashMap<>();
            responseSchema.put("type", "OBJECT");
            
            Map<String, Object> properties = new HashMap<>();
            properties.put("status", Map.of(
                "type", "STRING",
                "enum", List.of("LISTO_PARA_VALIDAR", "NO_VALIDO", "REVISION")
            ));
            properties.put("motivo", Map.of("type", "STRING"));

            responseSchema.put("properties", properties);
            responseSchema.put("required", List.of("status", "motivo"));
            genConfig.put("responseSchema", responseSchema);
            requestBody.put("generationConfig", genConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("Enviando factura de emisor '{}' con total {} a Gemini para validación inteligente...", emisor, total);
            log.info("--- PROMPT ENVIADO A GEMINI ---\n{}\n-------------------------------", prompt);
            String rawResponse = restTemplate.postForObject(url, entity, String.class);

            if (rawResponse == null) {
                log.warn("Respuesta nula recibida de la API de Gemini.");
                return null;
            }

            // Parsear la respuesta
            JsonNode rootNode = objectMapper.readTree(rawResponse);
            JsonNode candidates = rootNode.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && parts.size() > 0) {
                    String jsonText = parts.get(0).path("text").asText();
                    log.info("--- RESPUESTA JSON DE GEMINI ---\n{}\n--------------------------------", jsonText);
                    JsonNode responseJson = objectMapper.readTree(jsonText);
                    
                    String status = responseJson.path("status").asText("REVISION");
                    String motivo = responseJson.path("motivo").asText("Revisar concepto.");
                    
                    log.info("Gemini respondió exitosamente: status={}, motivo='{}'", status, motivo);
                    return new GeminiResult(status, motivo);
                }
            }

            log.warn("Formato de respuesta inesperado de Gemini: {}", rawResponse);
            return null;

        } catch (Exception e) {
            log.error("Error al validar factura con Gemini API (activando fallback): {}", e.getMessage());
            return null;
        }
    }

    public static class GeminiResult {
        private final String status;
        private final String motivo;

        public GeminiResult(String status, String motivo) {
            this.status = status;
            this.motivo = motivo;
        }

        public String getStatus() {
            return status;
        }

        public String getMotivo() {
            return motivo;
        }
    }
}
