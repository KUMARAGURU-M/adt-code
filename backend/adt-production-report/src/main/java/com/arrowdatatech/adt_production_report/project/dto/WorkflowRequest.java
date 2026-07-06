package com.arrowdatatech.adt_production_report.project.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class WorkflowRequest {

    @NotBlank(message = "Workflow name is required")
    @JsonProperty("name")
    private String name;
}
