package com.arrowdatatech.adt_production_report.tool.dto;

import lombok.*;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ToolDto {
    private UUID    id;
    private String  name;
    private String  description;
    private String  toolUrl;
    private Boolean isActive;
}