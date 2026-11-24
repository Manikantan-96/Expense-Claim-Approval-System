package com.practice.backend.Service;



import com.practice.backend.DTO.ClaimResponse;
import com.practice.backend.Entity.ExpenseClaim;
import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Status;
import com.practice.backend.Repository.ExpenseClaimRepository;
import com.practice.backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service

public class FinanceClaimService {

    private final ExpenseClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public FinanceClaimService(ExpenseClaimRepository claimRepository, UserRepository userRepository, AuditService auditService) {
        this.claimRepository = claimRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<ClaimResponse> getFinanceQueue(String statusStr, int page, int size) {
       Status status = Status.valueOf(statusStr.toUpperCase());
        return claimRepository.findByStatus(
                status,
                PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "submittedAt"))
        ).map(ClaimResponse::fromEntity);
    }

    @Transactional
    public ClaimResponse takeClaim(String financeEmail, Long claimId) {
        User financeAdmin = userRepository.findByEmail(financeEmail).orElseThrow();

        // 1. Execute the Atomic SQL Update
        int updatedRows = claimRepository.takeClaimAtomic(claimId, financeAdmin);

        // 2. Evaluate the Race Condition
        if (updatedRows == 0) {
            throw new IllegalStateException("409 Conflict: Claim has already been taken or is not available.");
        }

        // 3. Fetch the updated claim to return it and log the audit
        ExpenseClaim claim = claimRepository.findById(claimId).orElseThrow();
        auditService.logAction(claim, financeAdmin, "FINANCE_TAKEN", "Claim assigned to " + financeAdmin.getName());

        return ClaimResponse.fromEntity(claim);
    }

    @Transactional
    public ClaimResponse approveClaim(String financeEmail, Long claimId) {
        ExpenseClaim claim = getClaimIfAssignedTo(financeEmail, claimId);

        if (claim.getStatus() != Status.FINANCE_PROCESSING) {
            throw new IllegalStateException("Claim must be in FINANCE_PROCESSING to be approved.");
        }

        claim.setStatus(Status.APPROVED);
        claim.setDecidedAt(java.time.LocalDateTime.now());

        // JPA automatically checks the @Version field here. If another admin forced an update,
        // this will throw ObjectOptimisticLockingFailureException.
        ExpenseClaim savedClaim = claimRepository.save(claim);

        auditService.logAction(savedClaim, claim.getAssignedFinance(), "FINANCE_APPROVED", "Approved for reimbursement");

        return ClaimResponse.fromEntity(savedClaim);
    }

    @Transactional
    public ClaimResponse rejectClaim(String financeEmail, Long claimId, String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Rejection reason is required.");
        }

        ExpenseClaim claim = getClaimIfAssignedTo(financeEmail, claimId);

        if (claim.getStatus() != Status.FINANCE_PROCESSING) {
            throw new IllegalStateException("Claim must be in FINANCE_PROCESSING to be rejected.");
        }

        claim.setStatus(Status.REJECTED);
        claim.setRejectionReason(reason);
        claim.setDecidedAt(java.time.LocalDateTime.now());

        ExpenseClaim savedClaim = claimRepository.save(claim);
        auditService.logAction(savedClaim, claim.getAssignedFinance(), "FINANCE_REJECTED", "Reason: " + reason);

        return ClaimResponse.fromEntity(savedClaim);
    }

    @Transactional
    public ClaimResponse reimburseClaim(String financeEmail, Long claimId) {
        // Any finance admin can reimburse an approved claim
        ExpenseClaim claim = claimRepository.findById(claimId).orElseThrow();
        User financeAdmin = userRepository.findByEmail(financeEmail).orElseThrow();

        if (claim.getStatus() != Status.APPROVED) {
            throw new IllegalStateException("Only APPROVED claims can be reimbursed.");
        }

        claim.setStatus(Status.REIMBURSED);
        ExpenseClaim savedClaim = claimRepository.save(claim);

        auditService.logAction(savedClaim, financeAdmin, "CLAIM_REIMBURSED", "Funds dispersed to employee");

        return ClaimResponse.fromEntity(savedClaim);
    }

    // --- Authorization Check ---
    private ExpenseClaim getClaimIfAssignedTo(String financeEmail, Long claimId) {
        ExpenseClaim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found"));

        if (claim.getAssignedFinance() == null || !claim.getAssignedFinance().getEmail().equals(financeEmail)) {
            throw new RuntimeException("403 Forbidden: You do not own this claim. Take it from the queue first.");
        }

        return claim;
    }
}
