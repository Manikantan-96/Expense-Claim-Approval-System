package com.practice.backend.Controller;


import com.practice.backend.DTO.ClaimResponse;
import com.practice.backend.DTO.RejectRequest;
import com.practice.backend.Service.ManagerClaimService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/claims")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerWorkflowController {

    private final ManagerClaimService managerService;

    @GetMapping("/team")
    public ResponseEntity<List<ClaimResponse>> getTeamClaims(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(managerService.getTeamClaims(userDetails.getUsername()));
    }

    @PutMapping("/{id}/manager-approve")
    public ResponseEntity<ClaimResponse> approveClaim(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(managerService.approveClaim(userDetails.getUsername(), id));
    }

    @PutMapping("/{id}/manager-reject")
    public ResponseEntity<ClaimResponse> rejectClaim(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody RejectRequest request) {
        return ResponseEntity.ok(managerService.rejectClaim(userDetails.getUsername(), id, request.getReason()));
    }
}
