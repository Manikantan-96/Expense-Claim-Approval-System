package com.practice.backend.Controller;

import com.practice.backend.Enum.Role;
import com.practice.backend.Service.AssignService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FINANCE_ADMIN')")
public class AdminController {
    private final AssignService assignService;

    @PutMapping("/{id}/manager")
    public ResponseEntity<Void> assignManager(@PathVariable Long id, @RequestBody Long request) {
        assignService.assignManager(id, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<Void> setRole(@PathVariable Long id, @RequestBody String request) {
        assignService.changeRole(id, Role.valueOf(request.toUpperCase()));
        return ResponseEntity.ok().build();
    }
}