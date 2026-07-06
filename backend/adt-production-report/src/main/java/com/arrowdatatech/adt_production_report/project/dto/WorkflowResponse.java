package com.arrowdatatech.adt_production_report.project.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class WorkflowResponse {
    private UUID id;
    private String name;
    private OffsetDateTime createdAt;
}
