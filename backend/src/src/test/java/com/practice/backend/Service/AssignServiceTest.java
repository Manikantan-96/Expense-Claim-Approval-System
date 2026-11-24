package com.practice.backend.Service;

import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Role;
import com.practice.backend.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AssignServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AssignService assignService;

    @Test
    void assignManager_WhenTargetIsNotManager_ShouldThrowException() {
        // Arrange
        User employee = User.builder().id(1L).role(Role.EMPLOYEE).build();
        User invalidManager = User.builder().id(2L).role(Role.EMPLOYEE).build(); // Target is not a MANAGER

        when(userRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(userRepository.findById(2L)).thenReturn(Optional.of(invalidManager));

        // Act & Assert
        assertThatThrownBy(() -> assignService.assignManager(1L, 2L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Target user is not a MANAGER");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void assignManager_WhenAssigningSelf_ShouldThrowException() {
        // Arrange
        User user = User.builder().id(1L).role(Role.MANAGER).build();

        // The exact same ID is passed for both employee and manager searches
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // Act & Assert
        assertThatThrownBy(() -> assignService.assignManager(1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("A user cannot be their own manager");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changeRole_ToManager_ShouldClearExistingManager() {
        // Arrange
        User boss = User.builder().id(99L).build();
        User employee = User.builder().id(1L).role(Role.EMPLOYEE).manager(boss).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(employee));

        // Act
        assignService.changeRole(1L, Role.MANAGER);

        // Assert
        assertThat(employee.getRole()).isEqualTo(Role.MANAGER);
        assertThat(employee.getManager()).isNull(); // Must be nullified
        verify(userRepository).save(employee);
    }
}