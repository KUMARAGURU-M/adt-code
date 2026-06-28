package com.arrowdatatech.adt_production_report.shift.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class ShiftResponse {

    private UUID id;
    private String name;
    private String startTime;
    private String endTime;
    private String description;
    private Boolean isActive;
    private OffsetDateTime createdAt;

    // Included when fetching for allotment board
    private List<ShiftEmployeeResponse> assignedEmployees;
}