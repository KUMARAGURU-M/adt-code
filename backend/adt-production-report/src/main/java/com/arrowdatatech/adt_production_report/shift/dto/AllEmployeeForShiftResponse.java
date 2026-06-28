package com.arrowdatatech.adt_production_report.shift.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class AllEmployeeForShiftResponse {

    private UUID userId;
    private String fullName;
    private String email;
    private UUID currentShiftId;
    private String currentShiftName;
}