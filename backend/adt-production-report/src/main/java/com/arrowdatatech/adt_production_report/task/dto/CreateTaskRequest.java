package com.arrowdatatech.adt_production_report.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class CreateTaskRequest {

    @JsonProperty("projectId")
    private UUID projectId;

    // Primary process (first in list used as FK, all stored in title)
    @JsonProperty("processIds")
    private List<UUID> processIds;

    @JsonProperty("taskTitle")
    private String taskTitle;

    @JsonProperty("description")
    private String description;

    @JsonProperty("status")
    private String status;

    @JsonProperty("dueDate")
    private LocalDate dueDate;

    @JsonProperty("assignedDate")
    private LocalDate assignedDate;

    // Pages string: "All Pages" | "1 - 50" | "50"
    @JsonProperty("assignedPages")
    private Integer assignedPages;

    @JsonProperty("assignedPagesStr")
    private String assignedPagesStr;

    @JsonProperty("complexity")
    private String complexity;

    // Chapter/Article/Batch: "Full Book" | "1 - 10" | "All Article"
    @JsonProperty("chapterArticleBatch")
    private String chapterArticleBatch;

    @JsonProperty("estimateHours")
    private BigDecimal estimateHours;

    @JsonProperty("serverPath")
    private String serverPath;

    @JsonProperty("assignedBy")
    private UUID assignedBy;

    @JsonProperty("totalPages")
    private Integer totalPages;

    @JsonProperty("jobAssignments")
    private List<JobAssignment> jobAssignments;

    @JsonProperty("employeeAssignments")
    private List<EmployeeAssignment> employeeAssignments;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class JobAssignment {

        @JsonProperty("jobId")
        private UUID jobId;

        @JsonProperty("assignedPages")
        private Integer assignedPages;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class EmployeeAssignment {

        @JsonProperty("userId")
        private UUID userId;

        @JsonProperty("assignedPages")
        private Integer assignedPages;
    }
}