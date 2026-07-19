package com.arrowdatatech.adt_production_report.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class CreateUserRequest {

    @NotBlank(message = "User ID is required")
    private String userCode;

    @JsonProperty("fullName")
    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Name must be under 100 characters")
    private String fullName;

    @Email(message = "Valid email is required")
    private String email;

    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    // Role name e.g. "Employee", "Manager", "Admin"
    @NotBlank(message = "Role is required")
    private String roleName;

    // Shift ID to assign
    private UUID shiftId;

    private String timezone;

    private Boolean isTopPerformer;

    private Boolean showCalendarStats;

    private Boolean isActive;

    private String employeeStatus;

    private LocalDate joiningDate;
}