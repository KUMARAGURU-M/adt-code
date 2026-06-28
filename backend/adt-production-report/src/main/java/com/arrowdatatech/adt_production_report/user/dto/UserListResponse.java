package com.arrowdatatech.adt_production_report.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

// Lightweight version for table listings - fewer fields
@Getter
@Builder
public class UserListResponse {

    private UUID id;
    private String userCode;
    private String fullName;
    private String email;
    private String phone;
    private String role;        // Primary role display
    private String shift;       // Current shift name
    private Boolean isActive;
    private Boolean isTopPerformer;
    private String profilePhotoUrl;
}