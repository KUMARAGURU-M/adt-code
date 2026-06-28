package com.arrowdatatech.adt_production_report.tool.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor
public class SetToolAccessRequest {

    // The tool to update access for
    @JsonProperty("toolId")
    private UUID toolId;

    // The user to grant/deny
    @JsonProperty("userId")
    private UUID userId;

    // "Granted" | "Denied"
    @JsonProperty("access")
    private String access;
}