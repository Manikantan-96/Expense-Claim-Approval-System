package com.practice.backend.Security;

import com.practice.backend.Entity.User; // Adjust imports to your actual entities
import com.practice.backend.Enum.Role;
import com.practice.backend.Repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Only run this if the users table is completely empty
        if (userRepository.count() == 0) {

            User financeAdmin = new User();
            financeAdmin.setName("System Admin");
            financeAdmin.setEmail("finance@sentinel.com");
            financeAdmin.setPasswordHash(passwordEncoder.encode("admin123"));
            financeAdmin.setDepartment("Finance");
            financeAdmin.setRole(Role.FINANCE_ADMIN);

            User manager = new User();
            manager.setName("Engineering Manager");
            manager.setEmail("manager@sentinel.com");
            manager.setPasswordHash(passwordEncoder.encode("admin123"));
            manager.setDepartment("Engineering");
            manager.setRole(Role.MANAGER);

            User employee = new User();
            employee.setName("Software Engineer");
            employee.setEmail("employee@sentinel.com");
            employee.setPasswordHash(passwordEncoder.encode("admin123"));
            employee.setDepartment("Engineering");
            employee.setRole(Role.EMPLOYEE);
            employee.setManager(manager);


            // Save them to the database
            userRepository.save(financeAdmin);
            userRepository.save(manager);
            userRepository.save(employee);

            System.out.println("✅ Database seeded with default users!");
      }
    }
}
