package com.arrowdatatech.adt_production_report.workwise.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StopValidationResponse {

    // True only if pagesCompleted >= assignedPages
    private boolean canComplete;
    private Integer assignedPages;
    private Integer pagesCompletedSoFar;
    private String  taskTitle;
    private String  assignedPagesStr;
}








