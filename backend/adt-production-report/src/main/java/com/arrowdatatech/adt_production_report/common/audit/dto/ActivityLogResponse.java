package com.arrowdatatech.adt_production_report.common.audit.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class ActivityLogResponse {

    private UUID id;
    private UUID userId;
    private String userName;
    private String action;
    private String entityType;
    private UUID entityId;
    private String entityLabel;
    private String changes;
    private String ipAddress;
    private OffsetDateTime createdAt;
}