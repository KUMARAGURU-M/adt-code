package com.arrowdatatech.adt_production_report.tool.dto;

import lombok.*;
import java.util.List;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ToolWithAccessResponse {

    private UUID   toolId;
    private String toolName;
    private String description;

    // All users and their access status for this tool
    private List<ToolAccessDto> accessList;
}