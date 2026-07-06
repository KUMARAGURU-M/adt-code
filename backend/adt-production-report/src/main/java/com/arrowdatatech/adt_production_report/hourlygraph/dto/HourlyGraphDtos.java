package com.arrowdatatech.adt_production_report.hourlygraph.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class HourlyGraphDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HourlyGraphSettingsResponse {
        private Object columnGroups;
        private Object targetRows;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaveSettingsRequest {
        private Object columnGroups;
        private Object targetRows;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmployeeRowDto {
        private String id; // frontend row id
        private UUID userId;
        private String name;
        private String shift;
        private String inTime;
        private String outTime;
        private String project;
        private String process;
        private Boolean excluded;
        private Object hours; // Raw list of { process, value } or just values
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaveHourlyLogsRequest {
        private LocalDate date;
        private List<EmployeeRowDto> rows;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HourlyGraphResponse {
        private LocalDate date;
        private String activeDay;
        private List<EmployeeRowDto> rows;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ToggleVisibilityRequest {
        private boolean exclude;
    }
}
