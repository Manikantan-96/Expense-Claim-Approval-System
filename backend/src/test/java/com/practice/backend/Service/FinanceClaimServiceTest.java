package com.practice.backend.Service;

import com.practice.backend.Entity.User;
import com.practice.backend.Repository.ExpenseClaimRepository;
import com.practice.backend.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinanceClaimServiceTest {

    @Mock
    private ExpenseClaimRepository claimRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private FinanceClaimService financeClaimService;

    @Test
    void takeClaim_WhenRaceConditionOccurs_ShouldThrowConflictException() {
        // Arrange
        Long claimId = 100L;
        String financeEmail = "finance@company.com";
        User financeAdmin = new User();
        financeAdmin.setEmail(financeEmail);

        when(userRepository.findByEmail(financeEmail)).thenReturn(Optional.of(financeAdmin));

        // Simulate a race condition: The atomic query returns 0 rows updated
        when(claimRepository.takeClaimAtomic(eq(claimId), any(User.class))).thenReturn(0);

        // Act & Assert
        assertThatThrownBy(() -> financeClaimService.takeClaim(financeEmail, claimId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("409 Conflict");

        // Verify the audit service was NEVER called because the transaction failed
        verify(auditService, never()).logAction(any(), any(), any(), any());
    }
}
