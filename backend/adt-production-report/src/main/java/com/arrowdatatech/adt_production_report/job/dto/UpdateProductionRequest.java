package com.arrowdatatech.adt_production_report.job.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class UpdateProductionRequest {

    @JsonProperty("processStatus")
    private String processStatus;

    @JsonProperty("qcStatus")
    private String qcStatus;

    @JsonProperty("endDate")
    private LocalDate endDate;

    @JsonProperty("employees")
    private java.util.List<String> employees;

    @JsonProperty("refType")
    private String refType;
}
