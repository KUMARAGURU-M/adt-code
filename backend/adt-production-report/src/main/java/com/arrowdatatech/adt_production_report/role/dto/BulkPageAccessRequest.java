package com.arrowdatatech.adt_production_report.role.dto;

import lombok.*;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class BulkPageAccessRequest {
    @com.fasterxml.jackson.annotation.JsonProperty("grantedIds")
    private List<UUID> grantedIds;

    @com.fasterxml.jackson.annotation.JsonProperty("deniedIds")
    private List<UUID> deniedIds;
}
