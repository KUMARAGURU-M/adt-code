package com.arrowdatatech.adt_production_report.workwise.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StopTaskResponse {

    private TimeLogResponse timeLog;
    private boolean         taskCompleted;

    // Next task auto-suggested after completion
    private MyTaskOption    nextTask;
    private String          message;
}