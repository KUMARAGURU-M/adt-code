package com.arrowdatatech.adt_production_report.shift.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
public class ShiftEmployeeResponse {

    private UUID userId;
    private String fullName;
    private String email;
    private LocalDate effectiveFrom;
}