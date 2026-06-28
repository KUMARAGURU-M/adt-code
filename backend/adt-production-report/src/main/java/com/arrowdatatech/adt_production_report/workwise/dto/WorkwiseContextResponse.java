package com.arrowdatatech.adt_production_report.workwise.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class WorkwiseContextResponse {

    private UUID    timeLogId;
    private String  status;

    private OffsetDateTime startedAt;
    private Integer        elapsedSeconds;
    private Integer        breakSeconds;
    private Integer        workingSeconds;

    // Running task context
    private String  projectName;
    private String  processName;
    private String  isbnBookTitle;
    private String  dueDate;
    private String  assignedPagesAndChapter;
    private String  shift;
    private String  complexity;
    private Integer totalPages;
    private String  taskDescription;

    // Page completion tracking — for stop popup validation
    private Integer assignedPages;
    private Integer pagesCompletedSoFar;

    // Active break
    private UUID           activeBreakLogId;
    private String         breakReason;
    private OffsetDateTime breakStartedAt;
}