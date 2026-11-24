package com.practice.backend.Repository;


import com.practice.backend.Entity.ExpenseClaim;
import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.Modifying;


import java.util.List;

public interface ExpenseClaimRepository extends JpaRepository<ExpenseClaim, Long> {

    // Previous methods...
    List<ExpenseClaim> findByEmployeeIdOrderByExpenseDateDesc(Long employeeId);

    /*SELECT *
FROM expense_claim c
INNER JOIN employee e ON c.employee_id = e.id
WHERE e.manager_id = ?
ORDER BY c.submitted_at DESC;*/


    @Query("SELECT c FROM " +
            "ExpenseClaim c JOIN c.employee e" +
            " WHERE e.manager.id = :managerId " +
            "ORDER BY c.submittedAt DESC")
    List<ExpenseClaim> findClaimsByManagerId(@Param("managerId") Long managerId);

    // Paginated queue for Finance
    Page<ExpenseClaim> findByStatus(Status status, Pageable pageable);

    // The Atomic Take Operation
    // This executes directly against the database, bypassing Hibernate's cache
    /*UPDATE expense_claim
      SET status = 'FINANCE_PROCESSING',
      assigned_finance = ?
      WHERE id = ?
      AND status = 'FINANCE_REVIEW'
      AND assigned_finance IS NULL;*/
    @Modifying
    @Query("UPDATE ExpenseClaim" +
            " c SET c.status = 'FINANCE_PROCESSING'," +
            " c.assignedFinance = :financeAdmin" +
            " WHERE c.id = :claimId " +
            "AND c.status = 'FINANCE_REVIEW' " +
            "AND c.assignedFinance IS NULL")
    int takeClaimAtomic(@Param("claimId") Long claimId, @Param("financeAdmin") User financeAdmin);
}
