package com.practice.backend.Service;

import com.practice.backend.DTO.ClaimResponse;
import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Role;
import com.practice.backend.Repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class AssignService {
    private final UserRepository userRepository;

    @Transactional
    public void assignManager(Long employeeId, Long managerId) {
        User employee = userRepository.findById(employeeId).orElseThrow(() -> new NoSuchElementException("Employee not found"));
        User manager = userRepository.findById(managerId).orElseThrow(() -> new NoSuchElementException("Manager not found"));
        if (manager.getRole() != Role.MANAGER) {
            throw new IllegalArgumentException("Target user is not a MANAGER");
        }
        if (employee.getId().equals(manager.getId())) {
            throw new IllegalArgumentException("A user cannot be their own manager");
        }
        employee.setManager(manager);
        userRepository.save(employee);
    }

    @Transactional
    public void changeRole(Long userId, Role newRole) {
        User user = userRepository.findById(userId).orElseThrow(() -> new NoSuchElementException("User not found"));
        user.setRole(newRole);
        if (newRole == Role.MANAGER) user.setManager(null);
        userRepository.save(user);
    }
}
