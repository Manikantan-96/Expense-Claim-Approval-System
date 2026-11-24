package com.practice.backend.Controller;

import com.practice.backend.DTO.ClaimRequest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;


public class EmployeeWorkflowApiTest extends BaseApiTest {

    @Test
    void completeEmployeeWorkflow_ShouldCreateUploadAndSubmit() {
        String empToken = getAccessToken("employee@api.com", "password123");

        // 1. Create Draft
        ClaimRequest request = new ClaimRequest();
        request.setCategory("TRAVEL");
        request.setAmount(new BigDecimal("1000.50"));
        request.setDescription("Flight");
        request.setExpenseDate(LocalDate.now());

        Integer claimId = given()
                .header("Authorization", "Bearer " + empToken)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/claims")
                .then()
                .statusCode(200)
                .body("status", equalTo("DRAFT"))
                .extract().path("id");

        // 2. Upload Receipt (Explicitly specify "application/pdf" MIME type)
        given()
                .header("Authorization", "Bearer " + empToken)
                .multiPart("file", "receipt.pdf", "Dummy PDF content".getBytes(), "application/pdf")
                .when()
                .post("/claims/" + claimId + "/receipt")
                .then()
                .statusCode(200);

        // 3. Submit Claim
        given()
                .header("Authorization", "Bearer " + empToken)
                .when()
                .post("/claims/" + claimId + "/submit")
                .then()
                .statusCode(200)
                .body("status", equalTo("MANAGER_REVIEW"));
    }

    @Test
    void submitClaim_WithoutReceipt_ShouldReturn400() {
        String empToken = getAccessToken("employee@api.com", "password123");

        ClaimRequest request = new ClaimRequest();
        request.setCategory("MEALS");
        request.setAmount(new BigDecimal("50.00"));
        request.setExpenseDate(LocalDate.now());

        Integer claimId = given()
                .header("Authorization", "Bearer " + empToken)
                .contentType(ContentType.JSON)
                .body(request)
                .when().post("/claims").then().statusCode(200).extract().path("id");

        // Attempting to submit without calling the receipt upload endpoint first
        given()
                .header("Authorization", "Bearer " + empToken)
                .when()
                .post("/claims/" + claimId + "/submit")
                .then()
                .statusCode(400) // Bad Request triggered by IllegalStateException
                .body("error", containsString("receipt must be uploaded"));
    }
}