package com.arrowdatatech.adt_production_report.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DevProductivityReportResponse {

    private List<DevEmployeeReport> employees;
    private DevProductivityAnalytics analytics;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DevEmployeeReport {
        private UUID id;
        private String name;
        private String role;
        private String project;
        private String hoursThisWeek;
        private String status;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DevProductivityAnalytics {
        private String overallCompletion;
        private String efficiency;
        private String totalHours;
        private int correctionsResolved;
    }
}
