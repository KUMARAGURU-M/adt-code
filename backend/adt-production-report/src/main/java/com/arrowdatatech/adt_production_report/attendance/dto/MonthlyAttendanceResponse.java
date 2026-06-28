package com.arrowdatatech.adt_production_report.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class MonthlyAttendanceResponse {

    private int year;
    private int month; // 0-indexed

    // All active employees
    private List<AttendanceEmployeeResponse> employees;

    // Map: employeeId -> (day -> status)
    // day is 1-31 as string key
    private Map<UUID, Map<Integer, String>> attendance;

    // Salary details per employee
    private Map<UUID, SalaryDetailDto> salaryDetails;
}