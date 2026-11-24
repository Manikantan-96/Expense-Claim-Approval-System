package com.practice.backend.Service;


import com.practice.backend.DTO.ClaimResponse;
import com.practice.backend.Entity.ExpenseClaim;
import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Status;
import com.practice.backend.Repository.ExpenseClaimRepository;
import com.practice.backend.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ManagerClaimService {

    private final ExpenseClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public ManagerClaimService(ExpenseClaimRepository claimRepository, UserRepository userRepository, AuditService auditService) {
        this.claimRepository = claimRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> getTeamClaims(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail).orElseThrow();

        return claimRepository.findClaimsByManagerId(manager.getId())
                .stream()
                .map(ClaimResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClaimResponse approveClaim(String managerEmail, Long claimId) {
        User manager = userRepository.findByEmail(managerEmail).orElseThrow();
        ExpenseClaim claim = getClaimIfDirectReport(manager, claimId);

        if (claim.getStatus() != Status.MANAGER_REVIEW) {
            throw new IllegalStateException("Claim must be in MANAGER_REVIEW to be approved. Current status: " + claim.getStatus());
        }

        claim.setStatus(Status.FINANCE_REVIEW);
        claim.setRejectionReason(null); // Clear any previous rejection reasons
        claim.setDecidedAt(LocalDateTime.now());
        claim.setDecidedBy(manager);

        ExpenseClaim savedClaim = claimRepository.save(claim);

        // Write to audit log in the same transaction
        auditService.logAction(savedClaim, manager, "MANAGER_APPROVED", "Approved by direct manager");

        return ClaimResponse.fromEntity(savedClaim);
    }

    @Transactional
    public ClaimResponse rejectClaim(String managerEmail, Long claimId, String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Rejection reason is required.");
        }

        User manager = userRepository.findByEmail(managerEmail).orElseThrow();
        ExpenseClaim claim = getClaimIfDirectReport(manager, claimId);

        if (claim.getStatus() != Status.MANAGER_REVIEW) {
            throw new IllegalStateException("Claim must be in MANAGER_REVIEW to be rejected.");
        }

        claim.setStatus(Status.REJECTED);
        claim.setRejectionReason(reason);
        claim.setDecidedAt(LocalDateTime.now());
        claim.setDecidedBy(manager);

        ExpenseClaim savedClaim = claimRepository.save(claim);

        // Write to audit log in the same transaction
        auditService.logAction(savedClaim, manager, "MANAGER_REJECTED", "Reason: " + reason);

        return ClaimResponse.fromEntity(savedClaim);
    }

    // --- The Core Authorization Logic ---
    private ExpenseClaim getClaimIfDirectReport(User manager, Long claimId) {
        ExpenseClaim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found"));

        User employee = claim.getEmployee();

        // Security Check: Does this employee have a manager, and is it the user making the request?
        if (employee.getManager() == null || !employee.getManager().getId().equals(manager.getId())) {
            throw new RuntimeException("403 Forbidden: You are not authorized to manage this claim.");
        }

        return claim;
    }
}
