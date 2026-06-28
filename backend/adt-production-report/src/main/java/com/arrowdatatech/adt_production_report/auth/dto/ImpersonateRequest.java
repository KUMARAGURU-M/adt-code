package com.arrowdatatech.adt_production_report.auth.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class ImpersonateRequest {

    @NotNull(message = "Target user ID is required")
    private UUID targetUserId;
}