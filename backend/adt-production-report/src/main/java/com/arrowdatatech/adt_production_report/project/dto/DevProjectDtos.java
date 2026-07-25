package com.arrowdatatech.adt_production_report.project.dto;

import lombok.*;
import java.util.List;
import java.util.UUID;

public class DevProjectDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevProjectRequest {
        private String name;
        private String description;
        private String technologies;
        private String repositoryUrl;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevProjectResponse {
        private UUID id;
        private String name;
        private String description;
        private String technologies;
        private String repositoryUrl;
        private String status;
        private List<DevProjectUpdateResponse> updates;
        private List<DevProjectDocumentResponse> documents;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevProjectUpdateRequest {
        private String author;
        private String text;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevProjectUpdateResponse {
        private UUID id;
        private String author;
        private String text;
        private String date;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevProjectDocumentRequest {
        private String name;
        private String type;
        private String size;
        private String fileUrl;
        private UUID mediaFileId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevProjectDocumentResponse {
        private UUID id;
        private String name;
        private String type;
        private String size;
        private String fileUrl;
        private UUID mediaFileId;
    }
}
