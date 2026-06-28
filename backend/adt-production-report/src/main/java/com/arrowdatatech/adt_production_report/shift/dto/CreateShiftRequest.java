package com.arrowdatatech.adt_production_report.shift.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateShiftRequest {

    @NotBlank(message = "Shift name is required")
    @JsonProperty("name")
    private String name;

    @JsonProperty("startTime")
    private String startTime; // "09:00" format

    @JsonProperty("endTime")
    private String endTime; // "18:00" format

    @JsonProperty("description")
    private String description;

    @JsonProperty("isActive")
    private Boolean isActive;
}