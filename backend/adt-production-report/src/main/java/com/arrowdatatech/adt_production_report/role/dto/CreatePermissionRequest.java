package com.arrowdatatech.adt_production_report.role.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor
public class CreatePermissionRequest {

    // Bulk creation: resource × action matrix
    @JsonProperty("resources")
    private List<String> resources;     // ["employees","projects"]

    @JsonProperty("actions")
    private List<String> actions;       // ["create","update","delete"]

    @JsonProperty("description")
    private String description;

    @JsonProperty("isActive")
    private Boolean isActive;
}