package com.arrowdatatech.adt_production_report.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class UserResponse {

    private UUID id;
    private String userCode;
    private String email;
    private String fullName;
    private String phone;
    private String timezone;
    private Boolean isActive;
    private String employeeStatus;
    private Boolean isTopPerformer;
    private Boolean showCalendarStats;
    private LocalDate joiningDate;
    private OffsetDateTime lastLoginAt;
    private OffsetDateTime createdAt;

    // From user_role_assignments
    private List<String> roles;

    // Current shift name
    private String currentShift;
    private UUID currentShiftId;

    // Profile photo URL
    private String profilePhotoUrl;
}