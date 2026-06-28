package com.arrowdatatech.adt_production_report.common.audit.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminDashboardResponse {

    private Long totalUsers;
    private Long activeUsers;
    private Long totalProjects;
    private Long activeProjects;
    private Long totalTasks;
    private Double totalHoursLogged;

    // Quick stats for today
    private Long activeEmployeesToday;
    private Long tasksCompletedToday;
}