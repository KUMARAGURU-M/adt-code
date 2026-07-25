package com.arrowdatatech.adt_production_report.task.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

public class DevTaskDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevTaskRequest {
        private UUID projectId;
        private String title;
        private String description;
        private String assignedToName;
        private String assignedByName;
        private LocalDate assignedDate;
        private LocalDate dueDate;
        private String priority;
        private String status;
        private String correction;
        private String feedback;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevTaskResponse {
        private UUID id;
        private UUID projectId;
        private String project;
        private String title;
        private String description;
        private String assignedTo;
        private String assignedToRole;
        private String assignedBy;
        private LocalDate assignedDate;
        private LocalDate dueDate;
        private LocalDate completedDate;
        private String priority;
        private String status;
        private boolean completed;
        private String correction;
        private String feedback;
    }
}
