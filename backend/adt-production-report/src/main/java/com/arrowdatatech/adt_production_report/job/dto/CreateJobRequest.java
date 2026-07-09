package com.arrowdatatech.adt_production_report.job.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class CreateJobRequest {

    @JsonProperty("projectId")
    private UUID projectId;

    @JsonProperty("jobIdCode")
    private String jobIdCode;

    @JsonProperty("xmlIsbn")
    private String xmlIsbn;

    @JsonProperty("batch")
    private String batch;

    @JsonProperty("titleName")
    private String titleName;

    @JsonProperty("pageCount")
    private Integer pageCount;

    @JsonProperty("numberOfChapters")
    private Integer numberOfChapters;

    @JsonProperty("pdfInputType")
    private String pdfInputType;

    @JsonProperty("complexity")
    private String complexity;

    @JsonProperty("referenceType")
    private String referenceType;

    @JsonProperty("status")
    private String status;

    @JsonProperty("fileStatus")
    private String fileStatus;

    @JsonProperty("uploadDate")
    private LocalDate uploadDate;

    @JsonProperty("billingStatus")
    private String billingStatus;

    @JsonProperty("receiveDate")
    private LocalDate receiveDate;

    @JsonProperty("startMonth")
    private LocalDate startMonth;

    @JsonProperty("endMonth")
    private LocalDate endMonth;

    @JsonProperty("language")
    private String language;

    @JsonProperty("workflowId")
    private UUID workflowId;
}