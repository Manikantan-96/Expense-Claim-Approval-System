package com.practice.backend.Controller;



import com.practice.backend.DTO.ClaimRequest;
import com.practice.backend.DTO.ClaimResponse;
import com.practice.backend.Service.ExpenseClaimService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/claims")
public class ExpenseClaimController {

    private final ExpenseClaimService claimService;
    public ExpenseClaimController(ExpenseClaimService claimService) {
        this.claimService = claimService;
    }

    @PostMapping
    public ResponseEntity<ClaimResponse> createDraft(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ClaimRequest request) {
        return ResponseEntity.ok(claimService.createDraft(userDetails.getUsername(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClaimResponse> updateClaim(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody ClaimRequest request) {
        return ResponseEntity.ok(claimService.updateClaim(userDetails.getUsername(), id, request));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ClaimResponse> submitClaim(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(claimService.submitClaim(userDetails.getUsername(), id));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<ClaimResponse>> getMyClaims(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(claimService.getMyClaims(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClaimResponse> getClaimById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(claimService.getMyClaimById(userDetails.getUsername(), id));
    }

    @PostMapping(value = "/{id}/receipt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ClaimResponse> uploadReceipt(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(claimService.uploadReceipt(userDetails.getUsername(), id, file));
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<Resource> downloadReceipt(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        Resource file = claimService.getReceipt(userDetails.getUsername(), id);
        String contentType = claimService.getReceiptContentType(userDetails.getUsername(), id);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" +
                        file.getFilename() + "\"")
                .body(file);
    }
}
