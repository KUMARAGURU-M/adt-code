package com.arrowdatatech.adt_production_report.role.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter @Setter @NoArgsConstructor
public class CreateRoleRequest {
    @JsonProperty("name")        private String  name;
    @JsonProperty("description") private String  description;
    @JsonProperty("isActive")    private Boolean isActive;
}