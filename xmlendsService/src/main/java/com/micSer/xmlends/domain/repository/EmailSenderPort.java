package com.micSer.xmlends.domain.repository;

public interface EmailSenderPort {
    void sendAppealEmail(String to, String from, String fileName, String concepto, String justificacion);
}
