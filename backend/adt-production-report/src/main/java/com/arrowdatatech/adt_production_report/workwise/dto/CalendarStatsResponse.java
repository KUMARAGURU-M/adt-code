package com.arrowdatatech.adt_production_report.workwise.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarStatsResponse {

    private List<DailyStat> dailyStats;
    private List<WeeklyStat> weeklyStats;
    private List<ProjectStat> projectBreakdown;
    private SummaryStat monthlySummary;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyStat {
        private LocalDate date;
        private long workingSeconds;
        private int pagesCompleted;
        private Set<String> projectNames;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WeeklyStat {
        private String weekLabel;
        private LocalDate startDate;
        private LocalDate endDate;
        private long workingSeconds;
        private int pagesCompleted;
        private int projectCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProjectStat {
        private String projectName;
        private long workingSeconds;
        private int pagesCompleted;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummaryStat {
        private long totalWorkingSeconds;
        private int totalPagesCompleted;
        private int uniqueProjectsCount;
    }
}
