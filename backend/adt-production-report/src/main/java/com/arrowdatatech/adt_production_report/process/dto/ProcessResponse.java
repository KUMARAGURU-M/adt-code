package com.arrowdatatech.adt_production_report.process.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class ProcessResponse {

    private UUID id;
    private String name;
    private String description;
    private Boolean isActive;
    private OffsetDateTime createdAt;
}