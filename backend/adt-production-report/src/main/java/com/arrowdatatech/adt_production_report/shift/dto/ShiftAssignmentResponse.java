package com.arrowdatatech.adt_production_report.shift.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class ShiftAssignmentResponse {

    private UUID shiftId;
    private String shiftName;
    private Integer assignedCount;
    private String message;
}