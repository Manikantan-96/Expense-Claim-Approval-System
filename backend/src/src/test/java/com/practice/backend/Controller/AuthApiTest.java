package com.practice.backend.Controller;

import com.practice.backend.DTO.RegisterRequest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

public class AuthApiTest extends BaseApiTest {

    @Test
    void register_ShouldCreateEmployeeAndReturn200() {
        RegisterRequest req = new RegisterRequest();
        req.setName("New User");
        req.setEmail("new@api.com");
        req.setPassword("password123");
        req.setDepartment("Engineering");

        given()
                .contentType(ContentType.JSON)
                .body(req)
                .when()
                .post("/auth/register")
                .then()
                .statusCode(200)
                .body("message", equalTo("User registered successfully"));
    }

    @Test
    void login_WithValidCredentials_ShouldReturnTokenAndCookie() {
        given()
                .contentType(ContentType.JSON)
                .body("{ \"email\": \"employee@api.com\", \"password\": \"password123\" }")
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200)
                .body("accessToken", notNullValue())
                .cookie("refresh_token", notNullValue()); // Verifies the HttpOnly cookie is set
    }

    @Test
    void accessProtectedEndpoint_WithoutToken_ShouldReturn403() {
        given()
                .when()
                .get("/claims/mine")
                .then()
                .statusCode(403);
    }
}