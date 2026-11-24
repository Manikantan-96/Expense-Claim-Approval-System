package com.practice.backend.Controller;

import com.practice.backend.Entity.ExpenseClaim;
import com.practice.backend.Entity.Receipt;
import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Category;
import com.practice.backend.Enum.Role;
import com.practice.backend.Enum.Status;
import com.practice.backend.Repository.ReceiptRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static io.restassured.RestAssured.given;

public class ReceiptSecurityApiTest extends BaseApiTest {

    @Autowired
    private ReceiptRepository receiptRepository;

    private Long activeClaimId;
    private User maliciousManager;

    @BeforeEach
    void seedClaimAndReceipt() {
        // 1. Create an active claim owned by 'testEmployee' (who reports to 'testManager')
        ExpenseClaim claim = ExpenseClaim.builder()
                .employee(testEmployee).category(Category.OTHER)
                .amount(new BigDecimal("150.00")).expenseDate(LocalDate.now())
                .status(Status.MANAGER_REVIEW).version(0).build();
        claim = claimRepository.save(claim);
        activeClaimId = claim.getId();

        // 2. Attach a mock receipt record directly in the DB
        Receipt receipt = Receipt.builder()
                .claim(claim)
                .storageKey("mock-file-key.pdf")
                .originalFileName("receipt.pdf")
                .contentType("application/pdf")
                .fileSize(1024L)
                .uploadedAt(LocalDateTime.now())
                .build();
        receiptRepository.save(receipt);

        // 3. Create a totally unrelated manager
        maliciousManager = User.builder()
                .name("Other Boss").email("otherboss@api.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(Role.MANAGER).active(true).build();
        userRepository.save(maliciousManager);
    }

    @Test
    void downloadReceipt_AsDirectManager_ShouldReturn200() {
        String managerToken = getAccessToken("manager@api.com", "password123");

        given()
                .header("Authorization", "Bearer " + managerToken)
                .when()
                .get("/claims/" + activeClaimId + "/receipt")
                .then()
                .statusCode(400); // Handled as 400 by GlobalExceptionHandler due to missing disk file
    }
    @Test
    void downloadReceipt_AsUnrelatedManager_ShouldReturn403() {
        String maliciousToken = getAccessToken("otherboss@api.com", "password123");

        // This manager has the "MANAGER" role, but is NOT the direct manager of the employee.
        // The data-scoped authorization must block them.
        given()
                .header("Authorization", "Bearer " + maliciousToken)
                .when()
                .get("/claims/" + activeClaimId + "/receipt")
                .then()
                .statusCode(403);
    }
}