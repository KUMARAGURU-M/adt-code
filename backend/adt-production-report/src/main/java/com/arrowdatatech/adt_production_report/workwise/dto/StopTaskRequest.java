package com.arrowdatatech.adt_production_report.workwise.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class StopTaskRequest {

    @JsonProperty("timeLogId")
    private UUID timeLogId;

    @JsonProperty("pagesCompleted")
    private Integer pagesCompleted;

    @JsonProperty("markTaskCompleted")
    private Boolean markTaskCompleted;

    // "completed" | "on-hold" | "stopped"
    @JsonProperty("status")
    private String status;

    // On-hold reason if status = on-hold
    @JsonProperty("onHoldReason")
    private String onHoldReason;
}