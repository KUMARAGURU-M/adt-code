package com.arrowdatatech.adt_production_report.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class AttendanceRecordResponse {
    private UUID id;
    private UUID employeeId;
    private UUID userId;
    private String employeeName;
    private LocalDate attendanceDate;
    private String status;
    private OffsetDateTime checkInTime;
    private OffsetDateTime checkOutTime;
}
