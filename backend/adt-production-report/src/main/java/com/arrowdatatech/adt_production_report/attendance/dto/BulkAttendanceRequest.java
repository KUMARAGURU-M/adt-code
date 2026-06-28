package com.arrowdatatech.adt_production_report.attendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class BulkAttendanceRequest {

    @JsonProperty("year")
    private Integer year;

    @JsonProperty("month")
    private Integer month; // 0-indexed

    // employeeId -> (day -> status)
    // Entire month's attendance for all employees
    @JsonProperty("attendance")
    private Map<UUID, Map<Integer, String>> attendance;
}