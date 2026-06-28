package com.arrowdatatech.adt_production_report.workwise.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class TimeLogResponse {

    private UUID id;
    private UUID userId;
    private String employeeName;
    private UUID projectId;
    private String projectName;
    private UUID processId;
    private String processName;
    private String isbnTitle;
    private String taskTitle;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private Integer elapsedSeconds;
    private Integer workingSeconds;
    private Integer breakSeconds;
    private Integer pagesCompleted;
    private Integer assignedPages;
    private String assignedPagesStr;
    private String status;
    private LocalDate logDate;
    private String shift;
    private List<BreakLogDto> breakLogs;
    private OffsetDateTime manualCheckIn;
    private OffsetDateTime manualCheckOut;

    @Getter
    @Builder
    public static class BreakLogDto {
        private UUID id;
        private String breakReason;
        private String customReason;
        private String description;
        private OffsetDateTime breakStart;
        private OffsetDateTime breakEnd;
        private Integer durationSeconds;
    }
}