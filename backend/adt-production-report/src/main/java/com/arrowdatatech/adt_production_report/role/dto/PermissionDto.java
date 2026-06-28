package com.arrowdatatech.adt_production_report.role.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PermissionDto {
    private UUID   id;
    private String name;
    private String description;
    private String resource;
    private String action;
    private Boolean isActive;
    private OffsetDateTime createdAt;
}