package com.arrowdatatech.adt_production_report.auth.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class LoginResponse {

    private UUID userId;
    private String userCode;
    private String email;
    private String fullName;
    private String profilePhotoUrl;

    // All role names for this user e.g. ["Admin", "Manager"]
    private List<String> roles;

    // All permission codes e.g. ["employees.view", "tasks.create"]
    private List<String> permissions;

    // JWT access token - short lived (15 min)
    private String accessToken;

    // Refresh token - long lived (7 days)
    private String refreshToken;

    private String tokenType;

    // Where to redirect after login
    private String dashboardType; // "ADMIN" | "EMPLOYEE"
}