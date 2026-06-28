package com.arrowdatatech.adt_production_report.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class UserAssignmentsResponse {

    private UUID userId;
    private List<UUID> assignedProjectIds;
    private List<UUID> assignedProcessIds;
}