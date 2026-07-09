package com.arrowdatatech.adt_production_report.task.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class TaskResponse {

    private UUID id;
    private UUID projectId;
    private String projectName;
    private UUID processId;
    private String processName;
    private String taskTitle;
    private String description;
    private String status;
    private LocalDate assignedDate;
    private LocalDate dueDate;
    private Integer assignedPages;
    private String assignedPagesStr;
    private String complexity;
    private String chapterArticleBatch;
    private BigDecimal estimateHours;
    private String serverPath;
    private String assignedByName;
    private Integer totalPages;
    private OffsetDateTime createdAt;

    private UUID clientId;
    private String clientName;
    private UUID workflowId;
    private String workflowName;

    private List<JobInfo> jobs;
    private List<EmployeeInfo> employees;

    @Getter
    @Builder
    public static class JobInfo {
        private UUID jobId;
        private String jobIdCode;
        private String titleName;
        private String xmlIsbn;
        private Integer assignedPages;
        private Integer pageCount;
    }

    @Getter
    @Builder
    public static class EmployeeInfo {
        private UUID userId;
        private String fullName;
        private Integer assignedPages;
        private Integer pagesCompleted;
        private String status;
    }
}