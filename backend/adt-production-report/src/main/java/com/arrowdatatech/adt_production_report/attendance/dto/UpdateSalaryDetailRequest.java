package com.arrowdatatech.adt_production_report.attendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class UpdateSalaryDetailRequest {

    @JsonProperty("employeeId")
    private UUID employeeId;

    @JsonProperty("year")
    private Integer year;

    @JsonProperty("month")
    private Integer month;

    @JsonProperty("baseSalary")
    private BigDecimal baseSalary;

    @JsonProperty("incentive")
    private BigDecimal incentive;

    @JsonProperty("advance")
    private BigDecimal advance;

    @JsonProperty("salaryStatus")
    private String salaryStatus;

    @JsonProperty("isHidden")
    private Boolean isHidden;
}