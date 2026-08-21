package com.practice.backend.Repository;

import com.practice.backend.Entity.ExpenseClaim;
import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Category;
import com.practice.backend.Enum.Role;
import com.practice.backend.Enum.Status;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
public class ExpenseClaimRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ExpenseClaimRepository claimRepository;

    @Test
    void findClaimsByManagerId_ShouldOnlyReturnClaimsFromDirectReports() {
        // Arrange
        // 1. Create two distinct Managers
        User managerA = User.builder().name("Manager A").email("mana@test.com").passwordHash("hash").role(Role.MANAGER).active(true).build();
        User managerB = User.builder().name("Manager B").email("manb@test.com").passwordHash("hash").role(Role.MANAGER).active(true).build();
        entityManager.persist(managerA);
        entityManager.persist(managerB);

        // 2. Create Employees linked to their respective Managers
        User emp1 = User.builder().name("Emp 1").email("emp1@test.com").passwordHash("hash").role(Role.EMPLOYEE).manager(managerA).active(true).build();
        User emp2 = User.builder().name("Emp 2").email("emp2@test.com").passwordHash("hash").role(Role.EMPLOYEE).manager(managerB).active(true).build();
        entityManager.persist(emp1);
        entityManager.persist(emp2);

        // 3. Create Claims for both employees
        ExpenseClaim claim1 = ExpenseClaim.builder()
                .employee(emp1).category(Category.TRAVEL).amount(new BigDecimal("100.00"))
                .expenseDate(LocalDate.now()).status(Status.MANAGER_REVIEW).version(0).build();
        ExpenseClaim claim2 = ExpenseClaim.builder()
                .employee(emp2).category(Category.MEALS).amount(new BigDecimal("50.00"))
                .expenseDate(LocalDate.now()).status(Status.MANAGER_REVIEW).version(0).build();

        entityManager.persist(claim1);
        entityManager.persist(claim2);
        entityManager.flush(); // Force write to the in-memory database

        // Act: Manager A asks for their team's claims
        List<ExpenseClaim> managerAClaims = claimRepository.findClaimsByManagerId(managerA.getId());

        // Assert: Manager A should see Employee 1's claim, but NOT Employee 2's claim
        assertThat(managerAClaims).hasSize(1);
        assertThat(managerAClaims.get(0).getEmployee().getId()).isEqualTo(emp1.getId());
        assertThat(managerAClaims.get(0).getAmount()).isEqualByComparingTo("100.00");
    }
}