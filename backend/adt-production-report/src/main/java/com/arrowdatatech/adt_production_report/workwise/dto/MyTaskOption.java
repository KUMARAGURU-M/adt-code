package com.arrowdatatech.adt_production_report.workwise.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class MyTaskOption {
    private UUID    taskId;
    private String  taskTitle;
    private UUID    projectId;
    private String  projectName;
    private UUID    clientId;
    private String  clientName;
    private UUID    workflowId;
    private String  workflowName;
    private UUID    processId;
    private String  processName;
    private Integer assignedPages;
    private String  assignedPagesStr;
    private Integer pagesCompleted;
    private String  dueDate;
    private String  complexity;
    private String  chapterArticleBatch;
    @com.fasterxml.jackson.annotation.JsonProperty("isCompleted")
    private boolean isCompleted;
    private List<JobInfo> jobs;

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
}





