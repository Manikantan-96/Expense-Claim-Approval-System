package com.practice.backend.Service;
import com.practice.backend.Entity.ExpenseClaim;
import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Category;
import com.practice.backend.Enum.Status;
import com.practice.backend.Repository.ExpenseClaimRepository;
import com.practice.backend.Repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
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
class ManagerClaimServiceTest {

    @Mock private ExpenseClaimRepository claimRepository;
    @Mock private UserRepository userRepository;
    @Mock private AuditService auditService;

    @InjectMocks private ManagerClaimService managerClaimService;

    private User manager;
    private User employee;
    private ExpenseClaim claim;

    @BeforeEach
    void setUp() {
        manager = new User();
        manager.setId(1L);
        manager.setEmail("manager@test.com");

        employee = new User();
        employee.setId(2L);
        employee.setManager(manager); // Explicitly setting the hierarchy

        claim = new ExpenseClaim();
        claim.setId(100L);
        claim.setEmployee(employee);
        claim.setStatus(Status.MANAGER_REVIEW);
        claim.setCategory(Category.TRAVEL);
    }

    @Test
    void approveClaim_WhenDirectReport_ShouldTransitionToFinanceReview() {
        when(userRepository.findByEmail("manager@test.com")).thenReturn(Optional.of(manager));
        when(claimRepository.findById(100L)).thenReturn(Optional.of(claim));
        when(claimRepository.save(any(ExpenseClaim.class))).thenAnswer(i -> i.getArguments()[0]);

        var response = managerClaimService.approveClaim("manager@test.com", 100L);

        assertThat(response.getStatus()).isEqualTo("FINANCE_REVIEW");
        verify(auditService).logAction(any(), eq(manager), eq("MANAGER_APPROVED"), anyString());
    }

    @Test
    void approveClaim_WhenNotDirectReport_ShouldThrowForbidden() {
        User anotherManager = new User();
        anotherManager.setId(99L);
        anotherManager.setEmail("other@test.com");

        when(userRepository.findByEmail("other@test.com")).thenReturn(Optional.of(anotherManager));
        when(claimRepository.findById(100L)).thenReturn(Optional.of(claim));

        assertThatThrownBy(() -> managerClaimService.approveClaim("other@test.com", 100L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("403 Forbidden");
    }
}
