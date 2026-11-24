package com.practice.backend.Repository;

import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;


import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
public class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void makeManager_ShouldUpdateRoleAndNullifyExistingManager() {
        // Arrange
        User boss = User.builder().name("Boss").email("boss@test.com").passwordHash("hash").role(Role.MANAGER).active(true).build();
        entityManager.persist(boss);

        // Employee starts out reporting to 'Boss'
        User employee = User.builder().name("Emp").email("emp@test.com").passwordHash("hash").role(Role.EMPLOYEE).manager(boss).active(true).build();
        entityManager.persist(employee);
        entityManager.flush();

        // Act: Promote the employee to MANAGER
        userRepository.makeManager(employee.getId(), Role.MANAGER);

        // Clear the Level 1 cache so Hibernate is forced to re-fetch from the database
        entityManager.clear();

        // Assert
        User promotedUser = entityManager.find(User.class, employee.getId());
        assertThat(promotedUser.getRole()).isEqualTo(Role.MANAGER);

        // Critical Rule: Managers cannot have managers in this system's rules
        assertThat(promotedUser.getManager()).isNull();
    }

    @Test
    void setManagerForEmployee_ShouldUpdateManagerIdForeignKey() {
        // Arrange
        User newBoss = User.builder().name("New Boss").email("newboss@test.com").passwordHash("hash").role(Role.MANAGER).active(true).build();
        User employee = User.builder().name("Emp").email("emp2@test.com").passwordHash("hash").role(Role.EMPLOYEE).active(true).build();

        entityManager.persist(newBoss);
        entityManager.persist(employee);
        entityManager.flush();

        // Act
        userRepository.setManagerForEmployee(employee.getId(), newBoss);
        entityManager.clear();

        // Assert
        User updatedEmployee = entityManager.find(User.class, employee.getId());
        assertThat(updatedEmployee.getManager().getId()).isEqualTo(newBoss.getId());
    }
}