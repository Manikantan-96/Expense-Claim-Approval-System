package com.practice.backend.Repository;


import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Modifying
    @Query("UPDATE User u SET u.manager = :manager WHERE u.id = :id")
    void setManagerForEmployee(
            @Param("id") Long id,
            @Param("manager") User manager
    );

    @Modifying
    @Query("UPDATE User u SET u.manager = null, u.role = :role WHERE u.id = :id")
    void makeManager(
            @Param("id") Long id,
            @Param("role") Role role
    );
}
