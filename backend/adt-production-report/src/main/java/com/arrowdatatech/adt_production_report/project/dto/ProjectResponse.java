package com.arrowdatatech.adt_production_report.project.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class ProjectResponse {

    private UUID id;
    private String name;
    private String description;
    private UUID clientId;
    private String clientName;
    private String type;
    private String complexityLevel;
    private BigDecimal ratePerPage;
    private BigDecimal hourlyRate;
    private Boolean isActive;
    private OffsetDateTime createdAt;
    private UUID workflowId;
    private String workflowName;
}