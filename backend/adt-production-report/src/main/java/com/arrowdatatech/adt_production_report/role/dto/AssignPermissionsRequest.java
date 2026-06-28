package com.arrowdatatech.adt_production_report.role.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor
public class AssignPermissionsRequest {

    // Full replacement: replaces all existing permissions for this role
    @JsonProperty("permissionIds")
    private List<UUID> permissionIds;
}