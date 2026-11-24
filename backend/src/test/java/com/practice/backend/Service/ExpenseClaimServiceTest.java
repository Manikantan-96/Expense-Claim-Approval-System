package com.practice.backend.Service;

import com.practice.backend.Entity.ExpenseClaim;
import com.practice.backend.Entity.Receipt;
import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Category;
import com.practice.backend.Enum.Status;
import com.practice.backend.Repository.ExpenseClaimRepository;
import com.practice.backend.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExpenseClaimServiceTest {

    @Mock private ExpenseClaimRepository claimRepository;
    @Mock private UserRepository userRepository;
    @Mock private ReceiptStorageService receiptStorageService;

    @InjectMocks private ExpenseClaimService claimService;

    @Test
    void submitClaim_WithoutReceipt_ShouldThrowIllegalStateException() {
        User employee = new User();
        employee.setEmail("emp@test.com");

        ExpenseClaim draftClaim = new ExpenseClaim();
        draftClaim.setId(1L);
        draftClaim.setEmployee(employee);
        draftClaim.setStatus(Status.DRAFT);
        draftClaim.setReceipt(null); // Explicitly missing receipt

        when(claimRepository.findById(1L)).thenReturn(Optional.of(draftClaim));

        assertThatThrownBy(() -> claimService.submitClaim("emp@test.com", 1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("A receipt must be uploaded");
    }

    @Test
    void submitClaim_WithReceipt_ShouldRouteToManager() {
        User manager = new User();

        User employee = new User();
        employee.setEmail("emp@test.com");
        employee.setManager(manager);

        ExpenseClaim claim = new ExpenseClaim();
        claim.setId(1L);
        claim.setEmployee(employee);
        claim.setStatus(Status.DRAFT);
        claim.setCategory(Category.TRAVEL); // Set category to prevent NPE in fromEntity()
        claim.setReceipt(new Receipt());

        when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
        when(claimRepository.save(any(ExpenseClaim.class))).thenAnswer(i -> i.getArguments()[0]);

        var response = claimService.submitClaim("emp@test.com", 1L);

        assertThat(response.getStatus()).isEqualTo("MANAGER_REVIEW");
    }



}