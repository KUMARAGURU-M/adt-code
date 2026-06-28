package com.arrowdatatech.adt_production_report.attendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryDetailDto {

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