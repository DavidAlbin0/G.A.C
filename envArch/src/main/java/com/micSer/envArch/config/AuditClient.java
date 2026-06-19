package com.micSer.envArch.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Component
public class AuditClient {

    private final HttpClient httpClient;
    private final String auditServiceUrl;

    public AuditClient(@Value("${app.audit.service-url:http://audit-service:10101/api/audit}") String auditServiceUrl) {
        this.httpClient = HttpClient.newHttpClient();
        this.auditServiceUrl = auditServiceUrl;
    }

    public void logEvent(String username, String action, String details) {
        try {
            String escapedDetails = details != null ? details.replace("\"", "\\\"") : "";
            String jsonPayload = String.format(
                "{\"username\":\"%s\",\"action\":\"%s\",\"details\":\"%s\"}",
                username, action, escapedDetails
            );

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(auditServiceUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

            httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(response -> {
                    if (response.statusCode() != 200 && response.statusCode() != 201) {
                        System.err.println("Error al registrar auditoría, status: " + response.statusCode());
                    }
                })
                .exceptionally(ex -> {
                    System.err.println("Fallo al conectar con servicio de auditoría: " + ex.getMessage());
                    return null;
                });

        } catch (Exception e) {
            System.err.println("Error al enviar evento de auditoría: " + e.getMessage());
        }
    }
}
