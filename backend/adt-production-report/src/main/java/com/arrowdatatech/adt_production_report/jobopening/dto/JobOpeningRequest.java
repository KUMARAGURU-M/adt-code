package com.arrowdatatech.adt_production_report.jobopening.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class JobOpeningRequest {
    @NotBlank @Size(max = 300)
    private String title;

    @NotBlank @Size(max = 200)
    private String department;

    @NotBlank @Size(max = 200)
    private String location;

    @Size(max = 50)
    private String jobType = "Full-Time";

    @Size(max = 100)
    private String experience;

    private String description;
    private String tags;
}
