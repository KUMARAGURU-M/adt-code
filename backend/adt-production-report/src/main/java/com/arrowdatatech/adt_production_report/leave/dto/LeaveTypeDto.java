package com.arrowdatatech.adt_production_report.leave.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class LeaveTypeDto {
    private UUID   id;
    private String code;
    private String name;
    private String description;
    private Integer maxDaysPerYear;
    private Boolean carryForward;
    private Boolean requiresApproval;
    private Boolean isActive;
    private OffsetDateTime createdAt;
}