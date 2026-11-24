package com.practice.backend.Controller;

import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Role;
import com.practice.backend.Repository.ExpenseClaimRepository;
import com.practice.backend.Repository.UserRepository;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

import static io.restassured.RestAssured.given;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class BaseApiTest {

    @LocalServerPort
    protected int port;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected ExpenseClaimRepository claimRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    protected User testEmployee;
    protected User testManager;
    protected User testFinance;

    @BeforeEach
    public void setupEnvironment() {
        RestAssured.port = port;

        // Disable FK checks and truncate all tables to ensure clean state
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0;");
        jdbcTemplate.execute("TRUNCATE TABLE refresh_tokens;");
        jdbcTemplate.execute("TRUNCATE TABLE audit_logs;");
        jdbcTemplate.execute("TRUNCATE TABLE receipts;");
        jdbcTemplate.execute("TRUNCATE TABLE expense_claims;");
        jdbcTemplate.execute("TRUNCATE TABLE users;");
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1;");

        // Seed the hierarchy
        testManager = User.builder()
                .name("Manager").email("manager@api.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(Role.MANAGER).active(true).build();
        testManager = userRepository.save(testManager);

        testEmployee = User.builder()
                .name("Employee").email("employee@api.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(Role.EMPLOYEE).manager(testManager).active(true).build();
        testEmployee = userRepository.save(testEmployee);

        testFinance = User.builder()
                .name("Finance").email("finance@api.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(Role.FINANCE_ADMIN).active(true).build();
        testFinance = userRepository.save(testFinance);
    }

    protected String getAccessToken(String email, String password) {
        return given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", email, "password", password))
                .when().post("/auth/login")
                .then().statusCode(200)
                .extract().path("accessToken");
    }
}