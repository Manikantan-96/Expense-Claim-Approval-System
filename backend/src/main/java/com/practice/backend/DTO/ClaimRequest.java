package com.practice.backend.DTO;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ClaimRequest {
    private String category;
    private BigDecimal amount;
    private String description;
    private LocalDate expenseDate;
}