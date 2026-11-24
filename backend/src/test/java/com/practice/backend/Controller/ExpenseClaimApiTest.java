package com.practice.backend.Controller;

import com.practice.backend.DTO.ClaimRequest;
import com.practice.backend.DTO.RegisterRequest;
import com.practice.backend.Repository.UserRepository;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.math.BigDecimal;
import java.time.LocalDate;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class ExpenseClaimApiTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    private String validJwtToken;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;

        // Ensure clean test user
        if (!userRepository.existsByEmail("api@test.com")) {
            RegisterRequest regReq = new RegisterRequest();
            regReq.setName("API User");
            regReq.setEmail("api@test.com");
            regReq.setPassword("password");
            regReq.setDepartment("IT");

            given().contentType(ContentType.JSON).body(regReq)
                    .when().post("/auth/register");
        }

        // Login to retrieve Bearer token
        String responseStr = given()
                .contentType(ContentType.JSON)
                .body("{ \"email\": \"api@test.com\", \"password\": \"password\" }")
                .when().post("/auth/login")
                .then().statusCode(200)
                .extract().asString();

        // Extract the token string directly
        validJwtToken = responseStr.split("\"")[3];
    }

    @Test
    void createDraft_ShouldReturn200AndClaimDetails() {
        ClaimRequest request = new ClaimRequest();
        request.setCategory("EQUIPMENT");
        request.setAmount(new BigDecimal("1500.00"));
        request.setDescription("New monitor");
        request.setExpenseDate(LocalDate.now());

        given()
                .header("Authorization", "Bearer " + validJwtToken)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/claims")
                .then()
                .statusCode(200)
                .body("id", notNullValue())
                .body("status", equalTo("DRAFT"))
                .body("amount", equalTo(1500.0f));
    }

    @Test
    void getFinanceQueue_WithoutFinanceRole_ShouldReturn403() {
        // api@test.com registers as an EMPLOYEE. Hitting a FINANCE endpoint must fail.
        given()
                .header("Authorization", "Bearer " + validJwtToken)
                .when()
                .get("/claims/queue")
                .then()
                .statusCode(403);
    }
}