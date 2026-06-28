package com.arrowdatatech.adt_production_report.role.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RoleDto {
    private UUID   id;
    private String name;
    private String description;
    private Boolean isActive;
    private OffsetDateTime createdAt;
    // IDs of assigned permissions
    private List<UUID> permissionIds;
}