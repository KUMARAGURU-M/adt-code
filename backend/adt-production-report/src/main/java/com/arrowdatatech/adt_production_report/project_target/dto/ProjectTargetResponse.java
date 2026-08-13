package com.arrowdatatech.adt_production_report.project_target.dto;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTargetResponse {

    // Project Info
    private UUID projectId;
    private String projectName;
    private String clientName;
    private String billingType;
    private String complexityLevel;
    private Boolean isProjectActive;

    // Target configuration (null values if not set yet)
    private UUID targetId;
    private Integer year;
    private Integer month;
    private Integer monthlyTargetBooks;
    private Integer weeklyTargetBooks;
    private Integer week1TargetBooks;
    private Integer week2TargetBooks;
    private Integer week3TargetBooks;
    private Integer week4TargetBooks;
    private Integer week5TargetBooks;

    // Actual Progress counts
    private Integer actualCompletedMonth;
    private Integer actualCompletedWeek1;
    private Integer actualCompletedWeek2;
    private Integer actualCompletedWeek3;
    private Integer actualCompletedWeek4;
    private Integer actualCompletedWeek5;

    // Other status counts in this period
    private Integer actualPending;
    private Integer actualInProgress;
    private Integer actualOnHold;
    private Integer actualOther;

    // Billing Cycle dates
    private java.time.LocalDate billingCycleStartDate;
    private java.time.LocalDate billingCycleEndDate;

    // Target Page count configs
    private Integer targetPagesSimple;
    private Integer targetPagesMedium;
    private Integer targetPagesComplex;
    private Integer targetPagesHeavyComplex;
    private Integer targetPagesTotal;

    // Actual Completed Pages
    private Integer actualPagesSimple;
    private Integer actualPagesMedium;
    private Integer actualPagesComplex;
    private Integer actualPagesHeavyComplex;
    private Integer actualPagesTotal;

    // Weekly Completed Pages
    private Integer actualPagesWeek1;
    private Integer actualPagesWeek2;
    private Integer actualPagesWeek3;
    private Integer actualPagesWeek4;
    private Integer actualPagesWeek5;

    // Weekly Page Targets
    private Integer targetPagesWeek1;
    private Integer targetPagesWeek2;
    private Integer targetPagesWeek3;
    private Integer targetPagesWeek4;
}
