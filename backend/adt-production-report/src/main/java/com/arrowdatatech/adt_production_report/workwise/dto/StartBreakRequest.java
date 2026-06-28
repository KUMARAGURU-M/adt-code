package com.arrowdatatech.adt_production_report.workwise.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class StartBreakRequest {

    @JsonProperty("timeLogId")
    private UUID timeLogId;

    // Tea Break | Lunch Break | Restroom | Other
    @JsonProperty("breakReason")
    private String breakReason;

    // When breakReason = Other
    @JsonProperty("customReason")
    private String customReason;

    @JsonProperty("description")
    private String description;
}