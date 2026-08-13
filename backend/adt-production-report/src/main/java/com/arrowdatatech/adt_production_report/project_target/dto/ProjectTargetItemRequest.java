package com.arrowdatatech.adt_production_report.project_target.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTargetItemRequest {

    @NotNull(message = "ProjectId is required")
    private UUID projectId;

    private Integer targetPagesSimple;
    private Integer targetPagesMedium;
    private Integer targetPagesComplex;
    private Integer targetPagesHeavyComplex;
    private Integer targetPagesTotal;

    private Integer targetPagesWeek1;
    private Integer targetPagesWeek2;
    private Integer targetPagesWeek3;
    private Integer targetPagesWeek4;

    private Integer monthlyTargetBooks;
    private Integer weeklyTargetBooks;
    private Integer week1TargetBooks;
    private Integer week2TargetBooks;
    private Integer week3TargetBooks;
    private Integer week4TargetBooks;
    private Integer week5TargetBooks;
}
