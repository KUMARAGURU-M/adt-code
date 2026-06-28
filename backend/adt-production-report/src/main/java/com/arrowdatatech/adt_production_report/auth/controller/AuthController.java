package com.arrowdatatech.adt_production_report.auth.controller;

import com.arrowdatatech.adt_production_report.auth.dto.*;
import com.arrowdatatech.adt_production_report.auth.service.AuthService;
import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        log.info("Login attempt for identifier: {}", request.getIdentifier());

        String ipAddress = extractIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        LoginResponse response = authService.login(
                request, ipAddress, userAgent);

        return ResponseEntity.ok(
                ApiResponse.success("Login successful", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshTokenRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        authService.logout(request.getRefreshToken(), userId);

        return ResponseEntity.ok(
                ApiResponse.success("Logged out successfully", null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {

        LoginResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", response));
    }

    @PostMapping("/impersonate/{targetUserId}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<LoginResponse>> impersonate(
            @PathVariable UUID targetUserId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID adminId = UUID.fromString(userDetails.getUsername());
        LoginResponse response = authService.impersonateUser(adminId, targetUserId);
        return ResponseEntity.ok(
                ApiResponse.success("Impersonation started", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<String>> me(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                ApiResponse.success("Authenticated", userDetails.getUsername()));
    }

    private String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}