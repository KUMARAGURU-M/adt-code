package com.arrowdatatech.adt_production_report.job.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class JobResponse {

    private UUID id;
    private UUID projectId;
    private String projectName;
    private String jobIdCode;
    private String xmlIsbn;
    private String batch;
    private String titleName;
    private Integer pageCount;
    private Integer numberOfChapters;
    private String pdfInputType;
    private String complexity;
    private String referenceType;
    private String status;
    private String fileStatus;
    private LocalDate uploadDate;
    private String billingStatus;
    private LocalDate receiveDate;
    private LocalDate startMonth;
    private LocalDate endMonth;
    private String processStatus;
    private String qcStatus;
    private LocalDate endDate;
    private java.util.List<String> employees;
    private LocalDate productionStartDate;
    private UUID importBatchId;
    private OffsetDateTime createdAt;
    private java.util.List<String> processes;
    private String language;
    private UUID workflowId;
    private String workflowName;
    private String clientName;
    private UUID clientId;
}


