package com.arrowdatatech.adt_production_report.project_target.dto;

import lombok.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTargetRequest {

    @NotNull(message = "Project ID is required")
    private UUID projectId;

    @NotNull(message = "Year is required")
    @Min(value = 2000, message = "Year must be at or after 2000")
    private Integer year;

    @NotNull(message = "Month is required")
    @Min(value = 1, message = "Month must be between 1 and 12")
    @Max(value = 12, message = "Month must be between 1 and 12")
    private Integer month;

    private Integer monthlyTargetBooks;

    @Min(value = 0, message = "Target must be non-negative")
    private Integer weeklyTargetBooks;

    @Min(value = 0, message = "Target must be non-negative")
    private Integer week1TargetBooks;

    @Min(value = 0, message = "Target must be non-negative")
    private Integer week2TargetBooks;

    @Min(value = 0, message = "Target must be non-negative")
    private Integer week3TargetBooks;

    @Min(value = 0, message = "Target must be non-negative")
    private Integer week4TargetBooks;

    @Min(value = 0, message = "Target must be non-negative")
    private Integer week5TargetBooks;

    private java.time.LocalDate billingCycleStartDate;
    private java.time.LocalDate billingCycleEndDate;

    private Integer targetPagesSimple;
    private Integer targetPagesMedium;
    private Integer targetPagesComplex;
    private Integer targetPagesHeavyComplex;
    private Integer targetPagesTotal;

    private Integer targetPagesWeek1;
    private Integer targetPagesWeek2;
    private Integer targetPagesWeek3;
    private Integer targetPagesWeek4;
}
