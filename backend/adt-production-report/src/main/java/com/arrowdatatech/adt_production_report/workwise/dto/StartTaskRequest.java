package com.arrowdatatech.adt_production_report.workwise.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class StartTaskRequest {

    // Optional - if selected, auto-fills project/process/job
    @JsonProperty("taskId")
    private UUID taskId;

    @JsonProperty("projectId")
    private UUID projectId;

    @JsonProperty("jobId")
    private UUID jobId;

    @JsonProperty("processId")
    private UUID processId;
}