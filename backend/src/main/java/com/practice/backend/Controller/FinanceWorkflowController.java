package com.practice.backend.Controller;


import com.practice.backend.DTO.ClaimResponse;
import com.practice.backend.DTO.RejectRequest;
import com.practice.backend.Service.FinanceClaimService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/claims")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FINANCE_ADMIN')")
public class FinanceWorkflowController {

    private final FinanceClaimService financeService;

    @GetMapping("/queue")
    public ResponseEntity<Page<ClaimResponse>> getFinanceQueue(
            @RequestParam(defaultValue = "FINANCE_REVIEW") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(financeService.getFinanceQueue(status, page, size));
    }

    @PostMapping("/{id}/take")
    public ResponseEntity<ClaimResponse> takeClaim(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(financeService.takeClaim(userDetails.getUsername(), id));
    }

    @PutMapping("/{id}/finance-approve")
    public ResponseEntity<ClaimResponse> approveClaim(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(financeService.approveClaim(userDetails.getUsername(), id));
    }

    @PutMapping("/{id}/finance-reject")
    public ResponseEntity<ClaimResponse> rejectClaim(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody RejectRequest request) {
        return ResponseEntity.ok(financeService.rejectClaim(userDetails.getUsername(), id, request.getReason()));
    }

    @PutMapping("/{id}/reimburse")
    public ResponseEntity<ClaimResponse> reimburseClaim(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(financeService.reimburseClaim(userDetails.getUsername(), id));
    }

}