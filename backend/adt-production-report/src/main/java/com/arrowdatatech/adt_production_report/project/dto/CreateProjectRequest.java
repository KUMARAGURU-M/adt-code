package com.arrowdatatech.adt_production_report.project.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    @JsonProperty("name")
    private String name;

    @JsonProperty("description")
    private String description;

    @JsonProperty("clientId")
    private UUID clientId;

    @NotBlank(message = "Type is required")
    @JsonProperty("type")
    private String type; // Per Page | Hourly | Per Article | Per KB

    @NotBlank(message = "Complexity level is required")
    @JsonProperty("complexityLevel")
    private String complexityLevel; // Simple | Medium | Complex | Heavy Complex

    @NotNull(message = "Rate per page is required")
    @JsonProperty("ratePerPage")
    private BigDecimal ratePerPage;

    @JsonProperty("hourlyRate")
    private BigDecimal hourlyRate;

    @JsonProperty("isActive")
    private Boolean isActive;

    @JsonProperty("workflowId")
    private UUID workflowId;
}