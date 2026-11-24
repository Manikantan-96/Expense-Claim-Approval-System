package com.practice.backend.Service;


import com.practice.backend.DTO.ClaimRequest;
import com.practice.backend.DTO.ClaimResponse;
import com.practice.backend.Entity.ExpenseClaim;
import com.practice.backend.Entity.Receipt;
import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Category;
import com.practice.backend.Enum.Role;
import com.practice.backend.Enum.Status;
import com.practice.backend.Repository.ExpenseClaimRepository;
import com.practice.backend.Repository.ReceiptRepository;
import com.practice.backend.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.core.io.Resource;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseClaimService {

    private final ExpenseClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final ReceiptStorageService receiptStorageService;

    public ExpenseClaimService(ExpenseClaimRepository claimRepository, UserRepository userRepository, ReceiptStorageService receiptStorageService) {
        this.claimRepository = claimRepository;
        this.userRepository = userRepository;
        this.receiptStorageService = receiptStorageService;
    }

    @Transactional
    public ClaimResponse createDraft(String email, ClaimRequest request) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getAmount().signum() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }

        ExpenseClaim claim = ExpenseClaim.builder()
                .employee(employee)
                .category(Category.valueOf(request.getCategory().toUpperCase()))
                .amount(request.getAmount())
                .description(request.getDescription())
                .expenseDate(request.getExpenseDate())
                .status(Status.DRAFT)
                .version(0) // Initialize optimistic lock
                .build();

        return ClaimResponse.fromEntity(claimRepository.save(claim));
    }

    @Transactional
    public ClaimResponse updateClaim(String email, Long claimId, ClaimRequest request) {
        ExpenseClaim claim = getClaimIfOwner(email, claimId);

        // Only editable in DRAFT or REJECTED
        if (claim.getStatus() != Status.DRAFT &&
                claim.getStatus() != Status.REJECTED) {
            throw new IllegalStateException("Claim is locked and cannot be edited in status: " + claim.getStatus());
        }
        if (request.getAmount().signum() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        claim.setCategory(Category.valueOf(request.getCategory().toUpperCase()));
        claim.setAmount(request.getAmount());
        claim.setDescription(request.getDescription());
        claim.setExpenseDate(request.getExpenseDate());
        // in submitClaim(), right before the routing logic:
        if (claim.getStatus() == Status.REJECTED) {
            claim.setRejectionReason(null);
            claim.setDecidedBy(null);
            claim.setDecidedAt(null);
            claim.setAssignedFinance(null);
        }
//                rejectionReason, decidedBy, decidedAt, and assignedFinance

        return ClaimResponse.fromEntity(claimRepository.save(claim));
    }

    @Transactional
    public ClaimResponse submitClaim(String email, Long claimId) {
        ExpenseClaim claim = getClaimIfOwner(email, claimId);

        if (claim.getStatus() != Status.DRAFT && claim.getStatus() != Status.REJECTED) {
            throw new IllegalStateException("Only DRAFT or REJECTED claims can be submitted.");
        }

        // Must have a receipt before submission (Spec requirement)
        if (claim.getReceipt() == null) {
            throw new IllegalStateException("A receipt must be uploaded before submitting a claim.");
        }

        // Employee action
//        claim.setStatus(Status.SUBMITTED);
        claim.setSubmittedAt(LocalDateTime.now());

        // System action (Auto-routing)
        if (claim.getEmployee().getManager() != null) {
            claim.setStatus(Status.MANAGER_REVIEW);
        } else {
            // If employee has no manager, route directly to finance
            claim.setStatus(Status.FINANCE_REVIEW);
        }

        return ClaimResponse.fromEntity(claimRepository.save(claim));
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> getMyClaims(String email) {
        User employee = userRepository.findByEmail(email).orElseThrow();
        return claimRepository.findByEmployeeIdOrderByExpenseDateDesc(employee.getId())
                .stream()
                .map(ClaimResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClaimResponse getMyClaimById(String email, Long claimId) {
        return ClaimResponse.fromEntity(getClaimIfOwner(email, claimId));
    }


    // Core Security & Authorization Check
    private ExpenseClaim getClaimIfOwner(String email, Long claimId) {
        ExpenseClaim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found"));

        if (!claim.getEmployee().getEmail().equals(email)) {
            throw new RuntimeException("403 Forbidden: You do not own this claim");
        }
        return claim;
    }


// ... inside ExpenseClaimService:

    @Transactional
    public ClaimResponse uploadReceipt(String email, Long claimId, MultipartFile file) {

        ExpenseClaim claim = getClaimIfOwner(email, claimId);

        if (claim.getStatus() != Status.DRAFT && claim.getStatus() != Status.REJECTED) {
            throw new IllegalStateException("Receipts can only be uploaded when the claim is in DRAFT or REJECTED status.");
        }

        // Store physical file
        String storageKey = receiptStorageService.store(file);
        // If claim already has a receipt, delete old physical file
        if (claim.getReceipt() != null) {
            String oldStorageKey = claim.getReceipt().getStorageKey();
            receiptStorageService.delete(oldStorageKey);
        }

        Receipt receipt = Receipt.builder()
                .storageKey(storageKey)
                .originalFileName(StringUtils.cleanPath(file.getOriginalFilename()))
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .uploadedAt(LocalDateTime.now())
                .claim(claim)
                .build();

        claim.setReceipt(receipt);
        claimRepository.save(claim);
        return ClaimResponse.fromEntity(claim);
    }

    @Transactional(readOnly = true)
    public Resource getReceipt(String email, Long claimId) {
        ExpenseClaim claim = claimRepository.findById(claimId).orElseThrow(() -> new RuntimeException("Claim not found"));
        User requester = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        boolean isOwner = claim.getEmployee().getId().equals(requester.getId());
        boolean isDirectManager = claim.getEmployee().getManager() != null &&
                        claim.getEmployee().getManager().getId()
                                .equals(requester.getId());

        boolean isFinanceAdmin = requester.getRole() == Role.FINANCE_ADMIN;

        if (!isOwner && !isDirectManager && !isFinanceAdmin) {
            throw new RuntimeException("403 Forbidden: You do not have permission to view this receipt.");
        }
        Receipt receipt = claim.getReceipt();
        if (receipt == null) {
            throw new RuntimeException("No receipt found for this claim.");
        }
        return receiptStorageService.loadAsResource(receipt.getStorageKey());
    }

    @Transactional(readOnly = true)
    public String getReceiptContentType(String email, Long claimId) {
        ExpenseClaim claim = claimRepository.findById(claimId).orElseThrow(() ->new RuntimeException("Claim not found"));
        Receipt receipt = claim.getReceipt();
        if (receipt == null) {
            return "application/octet-stream";
        }
        return receipt.getContentType();
    }
}
