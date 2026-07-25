package com.arrowdatatech.adt_production_report.correction.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

public class DevCorrectionDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevCorrectionRequest {
        private UUID taskId;
        private UUID projectId;
        private String correction;
        private String leadComment;
        private String assignedToName;
        private String assignedBy;
        private LocalDate assignedDate;
        private LocalDate dueDate;
        private String priority;
        private String developerReply;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevCorrectionResponse {
        private UUID id;
        private UUID taskId;
        private String task;
        private UUID projectId;
        private String project;
        private String correction;
        private String leadComment;
        private String assignedTo;
        private String assignedBy;
        private LocalDate assignedDate;
        private LocalDate dueDate;
        private String priority;
        private String reply;
        private String status;
    }
}
