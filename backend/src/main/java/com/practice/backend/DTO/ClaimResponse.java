package com.practice.backend.DTO;

import com.practice.backend.Entity.ExpenseClaim;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ClaimResponse {
    private Long id;
    private String category;
    private BigDecimal amount;
    private String description;
    private LocalDate expenseDate;
    private String status;
    private String rejectionReason;
    private LocalDateTime submittedAt;
    // Helper to map Entity -> DTO
    public static ClaimResponse fromEntity(ExpenseClaim claim) {
        return ClaimResponse.builder()
                .id(claim.getId())
                .category(claim.getCategory().name())
                .amount(claim.getAmount())
                .description(claim.getDescription())
                .expenseDate(claim.getExpenseDate())
                .status(claim.getStatus().name())
                .rejectionReason(claim.getRejectionReason())
                .submittedAt(claim.getSubmittedAt())
                .build();
    }
}
