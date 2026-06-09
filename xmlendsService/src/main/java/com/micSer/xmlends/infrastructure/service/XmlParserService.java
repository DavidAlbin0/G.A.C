package com.micSer.xmlends.infrastructure.service;

import com.micSer.xmlends.domain.model.ContenidoXml;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class XmlParserService {

    public ParsedXmlData parseXml(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            String xmlContent = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
            
            // Eliminar la marca de orden de bytes (BOM) de UTF-8 si existe
            if (xmlContent.startsWith("\uFEFF")) {
                xmlContent = xmlContent.substring(1);
            }
            // Eliminar espacios en blanco o saltos de línea iniciales/finales
            xmlContent = xmlContent.trim();

            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            dbFactory.setNamespaceAware(true);
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            
            Document doc;
            try (InputStream is = new java.io.ByteArrayInputStream(xmlContent.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
                doc = dBuilder.parse(is);
            }
            doc.getDocumentElement().normalize();

            // 1. Root elements (Comprobante)
            Element comprobante = doc.getDocumentElement();
            String totalStr = comprobante.getAttribute("Total");
            if (totalStr.isEmpty()) totalStr = comprobante.getAttribute("total");
            String subtotalStr = comprobante.getAttribute("SubTotal");
            if (subtotalStr.isEmpty()) subtotalStr = comprobante.getAttribute("subTotal");
            String moneda = comprobante.getAttribute("Moneda");
            if (moneda.isEmpty()) moneda = comprobante.getAttribute("moneda");
            String metodoPago = comprobante.getAttribute("MetodoPago");
            if (metodoPago.isEmpty()) metodoPago = comprobante.getAttribute("metodoPago");
            String formaPago = comprobante.getAttribute("FormaPago");
            if (formaPago.isEmpty()) formaPago = comprobante.getAttribute("formaPago");
            String fechaComprobante = comprobante.getAttribute("Fecha");
            if (fechaComprobante.isEmpty()) fechaComprobante = comprobante.getAttribute("fecha");

            BigDecimal total = totalStr.isEmpty() ? BigDecimal.ZERO : new BigDecimal(totalStr);
            BigDecimal subtotal = subtotalStr.isEmpty() ? BigDecimal.ZERO : new BigDecimal(subtotalStr);

            // 2. Emisor
            Element emisorEl = getElementByTagName(doc, "cfdi:Emisor", "Emisor");
            String rfcEmisor = "";
            String nombreEmisor = "";
            if (emisorEl != null) {
                rfcEmisor = emisorEl.getAttribute("Rfc");
                if (rfcEmisor.isEmpty()) rfcEmisor = emisorEl.getAttribute("rfc");
                nombreEmisor = emisorEl.getAttribute("Nombre");
                if (nombreEmisor.isEmpty()) nombreEmisor = emisorEl.getAttribute("nombre");
            }

            // 3. Receptor
            Element receptorEl = getElementByTagName(doc, "cfdi:Receptor", "Receptor");
            String rfcReceptor = "";
            String nombreReceptor = "";
            String usoCFDI = "";
            if (receptorEl != null) {
                rfcReceptor = receptorEl.getAttribute("Rfc");
                if (rfcReceptor.isEmpty()) rfcReceptor = receptorEl.getAttribute("rfc");
                nombreReceptor = receptorEl.getAttribute("Nombre");
                if (nombreReceptor.isEmpty()) nombreReceptor = receptorEl.getAttribute("nombre");
                usoCFDI = receptorEl.getAttribute("UsoCFDI");
                if (usoCFDI.isEmpty()) usoCFDI = receptorEl.getAttribute("usoCFDI");
            }

            // 4. TimbreFiscalDigital (UUID and FechaTimbrado)
            Element timbreEl = getElementByTagName(doc, "tfd:TimbreFiscalDigital", "TimbreFiscalDigital");
            String uuid = "";
            LocalDateTime fechaTimbrado = null;
            if (timbreEl != null) {
                uuid = timbreEl.getAttribute("UUID");
                if (uuid.isEmpty()) uuid = timbreEl.getAttribute("uuid");
                String fechaTimbradoStr = timbreEl.getAttribute("FechaTimbrado");
                if (fechaTimbradoStr.isEmpty()) fechaTimbradoStr = timbreEl.getAttribute("fechaTimbrado");
                
                if (!fechaTimbradoStr.isEmpty()) {
                    try {
                        fechaTimbrado = LocalDateTime.parse(fechaTimbradoStr, DateTimeFormatter.ISO_DATE_TIME);
                    } catch (Exception e) {
                        try {
                            fechaTimbrado = LocalDateTime.parse(fechaTimbradoStr, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
                        } catch (Exception ex) {
                            fechaTimbrado = LocalDateTime.now();
                        }
                    }
                }
            }
            if (fechaTimbrado == null && !fechaComprobante.isEmpty()) {
                try {
                    fechaTimbrado = LocalDateTime.parse(fechaComprobante, DateTimeFormatter.ISO_DATE_TIME);
                } catch (Exception e) {
                    fechaTimbrado = LocalDateTime.now();
                }
            } else if (fechaTimbrado == null) {
                fechaTimbrado = LocalDateTime.now();
            }

            // 5. Conceptos description concatenation
            List<String> conceptoList = new ArrayList<>();
            NodeList conceptoNodes = doc.getElementsByTagName("cfdi:Concepto");
            if (conceptoNodes.getLength() == 0) {
                conceptoNodes = doc.getElementsByTagName("Concepto");
            }
            for (int i = 0; i < conceptoNodes.getLength(); i++) {
                Element cEl = (Element) conceptoNodes.item(i);
                String desc = cEl.getAttribute("Descripcion");
                if (desc.isEmpty()) desc = cEl.getAttribute("descripcion");
                if (!desc.isEmpty()) {
                    conceptoList.add(desc);
                }
            }
            String concepto = String.join(", ", conceptoList);

            ContenidoXml contenidoXml = ContenidoXml.builder()
                    .rfcEmisor(rfcEmisor)
                    .nombreEmisor(nombreEmisor)
                    .rfcReceptor(rfcReceptor)
                    .nombreReceptor(nombreReceptor)
                    .usoCFDI(usoCFDI)
                    .subtotal(subtotal)
                    .total(total)
                    .moneda(moneda)
                    .metodoPago(metodoPago)
                    .formatoPago(formaPago)
                    .fechaTimbrado(fechaTimbrado)
                    .build();

            return new ParsedXmlData(uuid, concepto, fechaTimbrado, contenidoXml);

        } catch (Exception e) {
            throw new RuntimeException("Error al parsear el archivo XML: " + e.getMessage(), e);
        }
    }

    private Element getElementByTagName(Document doc, String tagWithNamespace, String tagLocal) {
        NodeList nl = doc.getElementsByTagName(tagWithNamespace);
        if (nl.getLength() > 0) {
            return (Element) nl.item(0);
        }
        nl = doc.getElementsByTagName(tagLocal);
        if (nl.getLength() > 0) {
            return (Element) nl.item(0);
        }
        nl = doc.getElementsByTagNameNS("*", tagLocal);
        if (nl.getLength() > 0) {
            return (Element) nl.item(0);
        }
        return null;
    }

    public static class ParsedXmlData {
        public final String uuid;
        public final String concepto;
        public final LocalDateTime fechaFactura;
        public final ContenidoXml contenidoXml;

        public ParsedXmlData(String uuid, String concepto, LocalDateTime fechaFactura, ContenidoXml contenidoXml) {
            this.uuid = uuid;
            this.concepto = concepto;
            this.fechaFactura = fechaFactura;
            this.contenidoXml = contenidoXml;
        }
    }
}
