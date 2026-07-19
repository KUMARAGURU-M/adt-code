package com.arrowdatatech.adt_production_report.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class UpdateUserRequest {

    @Size(max = 100)
    private String fullName;

    @Email
    private String email;

    private String phone;

    private String roleName;

    private UUID shiftId;

    private String timezone;

    private Boolean isTopPerformer;

    private Boolean showCalendarStats;

    private Boolean isActive;

    private String employeeStatus;

    private LocalDate joiningDate;
}