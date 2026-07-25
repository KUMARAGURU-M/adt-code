package com.arrowdatatech.adt_production_report.meeting.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class DevMeetingDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevMeetingRequest {
        private String title;
        private String project;
        private LocalDate date;
        private String time;
        private String location;
        private List<String> attendees;
        private String agenda;
        private String discussion;
        private String decisions;
        private String actionItems;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActionItemResponse {
        private UUID id;
        private String text;
        private boolean completed;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevMeetingResponse {
        private UUID id;
        private String title;
        private String project;
        private LocalDate date;
        private String time;
        private String location;
        private List<String> attendees;
        private String agenda;
        private String discussion;
        private List<String> decisions;
        private List<ActionItemResponse> actionItems;
        private String createdBy;
    }
}
