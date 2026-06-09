package com.micSer.xmlends.infrastructure.service;

import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

@Service
public class SatValidationService {

    public String validateUuid(String uuid, String rfcEmisor, String rfcReceptor, BigDecimal total) {
        // Formatear el total con 6 decimales obligatorios para el SAT
        String totalFormatted = String.format("%.6f", total);
        
        // Expresión impresa requerida por el SAT
        String expresion = "?re=" + rfcEmisor + "&rr=" + rfcReceptor + "&tt=" + totalFormatted + "&id=" + uuid;
        
        String soapEnvelope = 
            "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:temp=\"http://tempuri.org/\">" +
            "   <soapenv:Header/>" +
            "   <soapenv:Body>" +
            "      <temp:Consulta>" +
            "         <temp:expresionImpresa><![CDATA[" + expresion + "]]></temp:expresionImpresa>" +
            "      </temp:Consulta>" +
            "   </soapenv:Body>" +
            "</soapenv:Envelope>";
            
        try {
            URL url = new URL("https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setDoOutput(true);
            connection.setDoInput(true);
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            connection.setRequestProperty("Content-Type", "text/xml;charset=UTF-8");
            connection.setRequestProperty("SOAPAction", "http://tempuri.org/IConsultaCFDIService/Consulta");
            
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = soapEnvelope.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            int responseCode = connection.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
                    StringBuilder response = new StringBuilder();
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine.trim());
                    }
                    String xmlResponse = response.toString();
                    
                    if (xmlResponse.contains("<a:Estado>Vigente</a:Estado>") || xmlResponse.contains("<Estado>Vigente</Estado>")) {
                        return "Vigente";
                    } else if (xmlResponse.contains("<a:Estado>Cancelado</a:Estado>") || xmlResponse.contains("<Estado>Cancelado</Estado>")) {
                        return "Cancelado";
                    } else {
                        // Intentar obtener el CodigoEstatus que trae el detalle del error
                        int startCodigo = xmlResponse.indexOf("<a:CodigoEstatus>");
                        if (startCodigo == -1) startCodigo = xmlResponse.indexOf("<CodigoEstatus>");
                        int endCodigo = xmlResponse.indexOf("</a:CodigoEstatus>");
                        if (endCodigo == -1) endCodigo = xmlResponse.indexOf("</CodigoEstatus>");
                        
                        if (startCodigo != -1 && endCodigo != -1) {
                            String codigoEstatus = xmlResponse.substring(startCodigo + 17, endCodigo);
                            if (startCodigo == xmlResponse.indexOf("<CodigoEstatus>")) {
                                codigoEstatus = xmlResponse.substring(startCodigo + 15, endCodigo);
                            }
                            return codigoEstatus;
                        }

                        int start = xmlResponse.indexOf("<a:Estado>");
                        if (start == -1) start = xmlResponse.indexOf("<Estado>");
                        int end = xmlResponse.indexOf("</a:Estado>");
                        if (end == -1) end = xmlResponse.indexOf("</Estado>");
                        if (start != -1 && end != -1) {
                            String estado = xmlResponse.substring(start + 10, end);
                            if (start == xmlResponse.indexOf("<Estado>")) {
                                estado = xmlResponse.substring(start + 8, end);
                            }
                            return estado;
                        }
                        return "No Encontrado - XML de respuesta: " + xmlResponse.substring(0, Math.min(xmlResponse.length(), 100));
                    }
                }
            } else {
                return "ERROR_HTTP_" + responseCode;
            }
        } catch (Exception e) {
            System.err.println("Error consultando al SAT: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }
}
