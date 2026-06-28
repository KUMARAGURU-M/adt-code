package com.arrowdatatech.adt_production_report.shift.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class AssignShiftRequest {

    @NotNull(message = "At least one user ID is required")
    @JsonProperty("userIds")
    private List<UUID> userIds;
}