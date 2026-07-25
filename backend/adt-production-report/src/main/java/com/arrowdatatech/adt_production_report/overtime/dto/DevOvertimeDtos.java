package com.arrowdatatech.adt_production_report.overtime.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class DevOvertimeDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevOvertimeRequest {
        private LocalDate overtimeDate;
        private BigDecimal overtimeHours;
        private String description;
        private String startTime;
        private String endTime;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevOvertimeResponse {
        private UUID id;
        private UUID userId;
        private String developerName;
        private LocalDate overtimeDate;
        private BigDecimal overtimeHours;
        private String description;
        private String startTime;
        private String endTime;
        private String status;
        private String approvedBy;
        private java.time.OffsetDateTime createdAt;
    }
}
