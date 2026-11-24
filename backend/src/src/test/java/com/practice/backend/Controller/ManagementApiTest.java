package com.practice.backend.Controller;

import com.practice.backend.Entity.ExpenseClaim;
import com.practice.backend.Enum.Category;
import com.practice.backend.Enum.Status;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;

public class ManagementApiTest extends BaseApiTest {

    private Long activeClaimId;

    @BeforeEach
    void seedActiveClaim() {
        // Force a claim into the database that is already waiting for the Manager
        ExpenseClaim claim = ExpenseClaim.builder()
                .employee(testEmployee)
                .category(Category.EQUIPMENT)
                .amount(new BigDecimal("5000.00"))
                .expenseDate(LocalDate.now())
                .status(Status.MANAGER_REVIEW)
                .version(0)
                .build();
        activeClaimId = claimRepository.save(claim).getId();
    }

    @Test
    void managerApprove_ShouldTransitionToFinanceReview() {
        String managerToken = getAccessToken("manager@api.com", "password123");

        given()
                .header("Authorization", "Bearer " + managerToken)
                .when()
                .put("/claims/" + activeClaimId + "/manager-approve")
                .then()
                .statusCode(200)
                .body("status", equalTo("FINANCE_REVIEW"));
    }

    @Test
    void employeeAttemptsManagerAction_ShouldReturn403() {
        String empToken = getAccessToken("employee@api.com", "password123");

        given()
                .header("Authorization", "Bearer " + empToken)
                .when()
                .put("/claims/" + activeClaimId + "/manager-approve")
                .then()
                .statusCode(403); // Proves @PreAuthorize("hasRole('MANAGER')") works
    }

    @Test
    void financeWorkflow_TakeAndApprove_ShouldSucceed() {
        String financeToken = getAccessToken("finance@api.com", "password123");

        // 1. Manually move claim to FINANCE_REVIEW for this test
        ExpenseClaim claim = claimRepository.findById(activeClaimId).get();
        claim.setStatus(Status.FINANCE_REVIEW);
        claimRepository.save(claim);

        // 2. Finance Takes the Claim
        given()
                .header("Authorization", "Bearer " + financeToken)
                .when()
                .post("/claims/" + activeClaimId + "/take")
                .then()
                .statusCode(200)
                .body("status", equalTo("FINANCE_PROCESSING"));

        // 3. Finance Approves the Claim
        given()
                .header("Authorization", "Bearer " + financeToken)
                .when()
                .put("/claims/" + activeClaimId + "/finance-approve")
                .then()
                .statusCode(200)
                .body("status", equalTo("APPROVED"));
    }

    @Test
    void financeReject_WithoutReason_ShouldReturn400() {
        String financeToken = getAccessToken("finance@api.com", "password123");

        ExpenseClaim claim = claimRepository.findById(activeClaimId).get();
        claim.setStatus(Status.FINANCE_PROCESSING);
        claim.setAssignedFinance(testFinance);
        claimRepository.save(claim);

        // Submitting rejection with an empty reason payload
        given()
                .header("Authorization", "Bearer " + financeToken)
                .contentType(ContentType.JSON)
                .body(Map.of("reason", ""))
                .when()
                .put("/claims/" + activeClaimId + "/finance-reject")
                .then()
                .statusCode(400)
                .body("error", containsString("reason is required"));
    }
}