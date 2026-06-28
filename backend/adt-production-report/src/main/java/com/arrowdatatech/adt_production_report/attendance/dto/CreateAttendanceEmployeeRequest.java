package com.arrowdatatech.adt_production_report.attendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class CreateAttendanceEmployeeRequest {

    @JsonProperty("name")
    private String name;

    @JsonProperty("category")
    private String category;

    @JsonProperty("gpayNumber")
    private String gpayNumber;

    @JsonProperty("baseSalary")
    private BigDecimal baseSalary;
}