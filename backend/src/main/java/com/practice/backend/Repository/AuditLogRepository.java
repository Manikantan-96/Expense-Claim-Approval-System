package com.practice.backend.Repository;


import com.practice.backend.Entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByClaimIdOrderByCreatedAtDesc(Long claimId);
}
