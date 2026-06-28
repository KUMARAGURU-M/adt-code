package com.arrowdatatech.adt_production_report.tool.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ToolAccessDto {

    private UUID   id;
    private UUID   toolId;
    private String toolName;
    private UUID   userId;
    private String employeeName;
    private String email;
    private String role;

    // Granted | Denied
    private String access;

    private UUID   grantedById;
    private String grantedByName;
    private OffsetDateTime updatedAt;
}