package com.practice.backend.Controller;

import com.practice.backend.DTO.ClaimResponse;
import com.practice.backend.Service.ManagerClaimService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class ManagerWorkflowControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ManagerClaimService managerService;

    @InjectMocks
    private ManagerWorkflowController managerWorkflowController;

    @BeforeEach
    void setUp() {
        // Resolves @AuthenticationPrincipal parameter for standalone MockMvc
        HandlerMethodArgumentResolver authenticationPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return User.withUsername("manager@test.com")
                        .password("password123")
                        .roles("MANAGER")
                        .build();
            }
        };

        mockMvc = MockMvcBuilders
                .standaloneSetup(managerWorkflowController)
                .setCustomArgumentResolvers(authenticationPrincipalResolver)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getTeamClaims_ShouldReturn200AndJsonArray() throws Exception {
        ClaimResponse dummyResponse = ClaimResponse.builder()
                .id(1L)
                .category("TRAVEL")
                .amount(new BigDecimal("500.00"))
                .status("MANAGER_REVIEW")
                .build();

        when(managerService.getTeamClaims(anyString())).thenReturn(List.of(dummyResponse));

        mockMvc.perform(get("/claims/team")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].category").value("TRAVEL"))
                .andExpect(jsonPath("$[0].amount").value(500.00));
    }
}