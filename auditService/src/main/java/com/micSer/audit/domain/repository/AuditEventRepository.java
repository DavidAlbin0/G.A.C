package com.micSer.audit.domain.repository;

import com.micSer.audit.domain.model.AuditEvent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditEventRepository extends MongoRepository<AuditEvent, String> {
    List<AuditEvent> findByUsername(String username);
}
