package com.practice.backend.Service;


import com.practice.backend.Entity.AuditLog;
import com.practice.backend.Entity.ExpenseClaim;
import com.practice.backend.Entity.User;
import com.practice.backend.Repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void logAction(ExpenseClaim claim, User actor, String action, String notes) {
        AuditLog log = AuditLog.builder()
                .claim(claim)
                .actor(actor)
                .action(action)
                .notes(notes)
                .build();
        auditLogRepository.save(log);
    }
}
