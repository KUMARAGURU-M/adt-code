package com.arrowdatatech.adt_production_report.techdocs.dto;

import lombok.*;
import java.util.UUID;

public class DevTechDocDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevTechDocRequest {
        private String name;
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DevTechDocResponse {
        private UUID id;
        private String name;
        private String content;
    }
}
