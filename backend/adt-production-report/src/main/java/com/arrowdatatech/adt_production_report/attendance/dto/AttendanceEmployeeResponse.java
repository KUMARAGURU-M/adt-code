package com.arrowdatatech.adt_production_report.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
public class AttendanceEmployeeResponse {
    private UUID id;
    private String name;
    private String category;
    private String gpayNumber;
    private BigDecimal baseSalary;
    private Integer sortOrder;
}