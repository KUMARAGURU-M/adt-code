package com.arrowdatatech.adt_production_report.project_target.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTargetDetailResponse {

    // Project metadata
    private UUID projectId;
    private String projectName;
    private String description;
    private String clientName;
    private String billingType;
    private String complexityLevel;
    private Boolean isProjectActive;
    private String workflowName;
    private List<String> workflowProcesses; // kept for compatibility, not rendered

    // Target configuration
    private UUID targetId;
    private Integer year;
    private Integer month;
    private LocalDate billingCycleStartDate;
    private LocalDate billingCycleEndDate;
    private Integer monthlyTargetBooks;
    private Integer weeklyTargetBooks;
    private Integer week1TargetBooks;
    private Integer week2TargetBooks;
    private Integer week3TargetBooks;
    private Integer week4TargetBooks;
    private Integer week5TargetBooks;
    private Integer targetPagesSimple;
    private Integer targetPagesMedium;
    private Integer targetPagesComplex;
    private Integer targetPagesHeavyComplex;
    private Integer targetPagesTotal;

    private Integer targetPagesWeek1;
    private Integer targetPagesWeek2;
    private Integer targetPagesWeek3;
    private Integer targetPagesWeek4;
    private Integer targetPagesWeek5;

    // Actual page output — uploaded jobs whose startMonth falls in billing cycle
    private Integer actualPagesSimple;
    private Integer actualPagesMedium;
    private Integer actualPagesComplex;
    private Integer actualPagesHeavyComplex;
    private Integer actualPagesTotal;

    // Actual pages per week (startMonth within each 7-day band from cycleStart)
    private Integer actualPagesWeek1;
    private Integer actualPagesWeek2;
    private Integer actualPagesWeek3;
    private Integer actualPagesWeek4;
    private Integer actualPagesWeek5;

    // Worked Employees (kept for compatibility, not rendered in UI)
    private List<WorkedEmployeeResponse> workedEmployees;

    // Page Output Registry — uploaded jobs with startMonth in billing cycle
    private List<JobDetailResponse> jobs;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkedEmployeeResponse {
        private String employeeName;
        private Integer bookCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JobDetailResponse {
        private UUID id;
        private String jobIdCode;
        private String xmlIsbn;
        private String batch;
        private String titleName;
        private Integer pageCount;
        private String complexity;
        private String status;
        private String fileStatus;
        private String processStatus;
        private String qcStatus;
        private LocalDate receiveDate;
        private LocalDate startMonth;   // production commenced date
        private LocalDate endMonth;     // production end date
        private LocalDate endDate;
        private LocalDate uploadDate;
        private Integer noOfDays;       // endMonth - startMonth in days
        private String taskName;        // task title linked via TaskJobAssignment
        private String employeeNames;
        private String qcEmployeeNames;
    }
}
