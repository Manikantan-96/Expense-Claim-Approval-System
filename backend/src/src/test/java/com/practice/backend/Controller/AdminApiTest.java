package com.practice.backend.Controller;

import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Role;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;


public class AdminApiTest extends BaseApiTest {

    @Test
    void assignManager_AsFinanceAdmin_ShouldReturn200() {
        String financeToken = getAccessToken("finance@api.com", "password123");

        // 1. Create a brand new unassigned employee for this test
        User newEmployee = User.builder()
                .name("Unassigned").email("unassigned@api.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(Role.EMPLOYEE).active(true).build();
        Long newEmpId = userRepository.save(newEmployee).getId();

        // 2. Assign 'testManager' (from BaseApiTest) to this new employee
        given()
                .header("Authorization", "Bearer " + financeToken)
                .contentType(ContentType.JSON)
                .body(testManager.getId()) // The request body expects the Manager ID (Long)[cite: 2]
                .when()
                .put("/admin/users/" + newEmpId + "/manager")
                .then()
                .statusCode(200);

        // 3. Verify in database that the manager was actually set
        User updatedEmployee = userRepository.findById(newEmpId).get();
        assert(updatedEmployee.getManager().getId().equals(testManager.getId()));
    }

    @Test
    void assignManager_AsEmployee_ShouldReturn403Forbidden() {
        String employeeToken = getAccessToken("employee@api.com", "password123");

        // 1. Create a fresh unassigned employee so the request payload is valid
        User newEmployee = User.builder()
                .name("Unassigned Employee")
                .email("unassigned_test@api.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(Role.EMPLOYEE)
                .active(true)
                .build();
        Long newEmpId = userRepository.save(newEmployee).getId();

        // 2. Attempt to assign manager using Employee token -> must return 403 Forbidden
        given()
                .header("Authorization", "Bearer " + employeeToken)
                .contentType(ContentType.JSON)
                .body(testManager.getId())
                .when()
                .put("/admin/users/" + newEmpId + "/manager")
                .then()
                .statusCode(403);
    }
}