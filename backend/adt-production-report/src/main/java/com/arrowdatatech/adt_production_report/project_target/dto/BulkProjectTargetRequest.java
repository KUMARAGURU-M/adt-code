package com.arrowdatatech.adt_production_report.project_target.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkProjectTargetRequest {

    @NotNull(message = "ClientId is required")
    private UUID clientId;

    @NotNull(message = "Year is required")
    private Integer year;

    @NotNull(message = "Month is required")
    private Integer month;

    @NotNull(message = "Billing cycle start date is required")
    private LocalDate billingCycleStartDate;

    @NotNull(message = "Billing cycle end date is required")
    private LocalDate billingCycleEndDate;

    @NotNull(message = "Targets list is required")
    @Valid
    private List<ProjectTargetItemRequest> targets;
}
