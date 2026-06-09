package com.micSer.audit.presentation.controller;

import com.micSer.audit.domain.model.AuditEvent;
import com.micSer.audit.domain.repository.AuditEventRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditEventRepository auditEventRepository;

    public AuditController(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    @PostMapping
    public ResponseEntity<AuditEvent> logEvent(@RequestBody AuditRequest request) {
        AuditEvent event = new AuditEvent(
            request.getUsername(),
            request.getAction(),
            request.getDetails()
        );
        AuditEvent saved = auditEventRepository.save(event);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<AuditEvent>> getEvents() {
        // Obtener eventos ordenados por fecha descendiente (más reciente primero)
        List<AuditEvent> events = auditEventRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp"));
        return ResponseEntity.ok(events);
    }

    // DTO estático para recibir solicitudes de auditoría
    public static class AuditRequest {
        private String username;
        private String action;
        private String details;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }

        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
    }
}
