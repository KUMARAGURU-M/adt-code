package com.arrowdatatech.adt_production_report.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class AssignProjectsRequest {

    @NotNull
    private List<UUID> projectIds;

    @NotNull
    private List<UUID> processIds;
}