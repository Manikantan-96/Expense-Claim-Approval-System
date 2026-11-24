package com.practice.backend.Service;

import com.practice.backend.Entity.RefreshToken;
import com.practice.backend.Entity.User;
import com.practice.backend.Enum.Role;
import com.practice.backend.Repository.RefreshTokenRepository;
import com.practice.backend.Repository.UserRepository;
import com.practice.backend.Security.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private HttpServletResponse response;
    @Mock private HttpServletRequest request;

    @InjectMocks private AuthService authService;

    @Test
    void login_WithDisabledUser_ShouldThrowException() {
        // Arrange
        String email = "disabled@test.com";
        User disabledUser = User.builder().email(email).active(false).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(disabledUser));

        // Act & Assert
        assertThatThrownBy(() -> authService.login(email, "password", response))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User account is disabled");

        // Verify token was never generated
        verify(jwtService, never()).generateToken(any(), any());
    }

    @Test
    void login_WithValidActiveUser_ShouldReturnAccessTokenAndSetCookie() {
        // Arrange
        String email = "active@test.com";
        User activeUser = User.builder().email(email).role(Role.EMPLOYEE).active(true).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(activeUser));
        when(jwtService.generateToken(email, "EMPLOYEE")).thenReturn("mock-access-token");

        // Act
        String token = authService.login(email, "password", response);

        // Assert
        assertThat(token).isEqualTo("mock-access-token");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(refreshTokenRepository).save(any(RefreshToken.class));
        verify(response).addHeader(anyString(),anyString());
    }

    @Test
    void refresh_WithRevokedToken_ShouldThrowException() {
        // Arrange
        Cookie refreshCookie = new Cookie("refresh_token", "raw-token-value");
        when(request.getCookies()).thenReturn(new Cookie[]{refreshCookie});

        RefreshToken revokedToken = RefreshToken.builder()
                .revoked(true)
                .expiresAt(LocalDateTime.now().plusDays(1)) // Not expired, but revoked
                .build();

        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(revokedToken));

        // Act & Assert
        assertThatThrownBy(() -> authService.refresh(request, response))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Refresh token expired or revoked");
    }
}