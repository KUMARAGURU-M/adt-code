package com.arrowdatatech.adt_production_report.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OverrideAttendanceRequest {

    @NotBlank(message = "Status is required")
    private String status; // P | A | H | PH | WO

    private String note;
}