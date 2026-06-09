package com.micSer.xmlends.infrastructure.adapter.service;

import com.micSer.xmlends.domain.repository.EmailSenderPort;
import org.springframework.stereotype.Component;

@Component
public class ConsoleEmailAdapter implements EmailSenderPort {

    @Override
    public void sendAppealEmail(String to, String from, String fileName, String concepto, String justificacion) {
        System.out.println("=========================================================================");
        System.out.println("                         ENVÍO DE CORREO (SIMULADO)                      ");
        System.out.println("=========================================================================");
        System.out.println("De: " + from);
        System.out.println("Para: " + to);
        System.out.println("Asunto: Apelación de Reembolso Rechazado - Archivo: " + fileName);
        System.out.println("-------------------------------------------------------------------------");
        System.out.println("Estimado revisor,");
        System.out.println("Se ha presentado una apelación para la factura con el concepto: ");
        System.out.println("  \"" + concepto + "\"");
        System.out.println("Archivo: " + fileName);
        System.out.println("\nJustificación del usuario:");
        System.out.println("  \"" + justificacion + "\"");
        System.out.println("-------------------------------------------------------------------------");
        System.out.println("Por favor, revise la factura en el panel de administración de XMLends.");
        System.out.println("=========================================================================");
    }
}
