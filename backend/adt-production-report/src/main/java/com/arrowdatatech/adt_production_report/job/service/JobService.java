package com.arrowdatatech.adt_production_report.job.service;

import com.arrowdatatech.adt_production_report.common.audit.service.ActivityLogService;
import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.job.dto.*;
import com.arrowdatatech.adt_production_report.job.entity.ImportBatch;
import com.arrowdatatech.adt_production_report.job.entity.ImportFieldMapping;
import com.arrowdatatech.adt_production_report.job.entity.Job;
import com.arrowdatatech.adt_production_report.job.repository.ImportBatchRepository;
import com.arrowdatatech.adt_production_report.job.repository.ImportFieldMappingRepository;
import com.arrowdatatech.adt_production_report.job.repository.JobRepository;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.project.entity.Workflow;
import com.arrowdatatech.adt_production_report.project.repository.ProjectRepository;
import com.arrowdatatech.adt_production_report.project.repository.WorkflowRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;
import com.arrowdatatech.adt_production_report.task.repository.TaskJobAssignmentRepository;
import com.arrowdatatech.adt_production_report.task.repository.TaskRepository;
import com.arrowdatatech.adt_production_report.task.entity.TaskJobAssignment;
import com.arrowdatatech.adt_production_report.task.entity.Task;


@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final ProjectRepository projectRepository;
    private final ImportBatchRepository importBatchRepository;
    private final ImportFieldMappingRepository fieldMappingRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final ObjectMapper objectMapper;
    private final TaskJobAssignmentRepository taskJobAssignmentRepository;
    private final TaskRepository taskRepository;
    private final WorkflowRepository workflowRepository;

    // ─────────────────────────────────────────────
    // SEARCH JOBS
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<JobResponse> searchJobs(UUID projectId,
                                        UUID clientId,
                                        String jobIdCode,
                                        String xmlIsbn,
                                        LocalDate startMonthFrom,
                                        LocalDate startMonthTo,
                                        String status,
                                        String billingStatus,
                                        String complexity,
                                        String fileStatus,
                                        int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Job> jobs = jobRepository.searchJobs(
                projectId,
                clientId,
                emptyToNull(jobIdCode),
                emptyToNull(xmlIsbn),
                startMonthFrom,
                startMonthTo,
                emptyToNull(status),
                emptyToNull(billingStatus),
                emptyToNull(complexity),
                emptyToNull(fileStatus),
                pageable
        );

        if (jobs.isEmpty()) {
            return Page.empty(pageable);
        }

        List<UUID> jobIds = jobs.getContent().stream().map(Job::getId).collect(Collectors.toList());
        List<TaskJobAssignment> assignments = taskJobAssignmentRepository.findAssignmentsByJobIds(jobIds);
        Map<UUID, List<TaskJobAssignment>> assignmentsByJobId = assignments.stream()
                .collect(Collectors.groupingBy(tja -> tja.getJob().getId()));

        List<UUID> projectIds = jobs.getContent().stream()
                .map(j -> j.getProject() != null ? j.getProject().getId() : null)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<UUID, List<String>> processesByProjectId = getProcessesByProjectIds(projectIds);

        return jobs.map(job -> {
            List<TaskJobAssignment> jobAssignments = assignmentsByJobId.getOrDefault(job.getId(), List.of());
            List<String> processes = processesByProjectId.getOrDefault(
                    job.getProject() != null ? job.getProject().getId() : null,
                    List.of()
            );

            List<String> employees = jobAssignments.stream()
                    .map(TaskJobAssignment::getTask)
                    .flatMap(task -> task.getEmployeeAssignments().stream())
                    .filter(tea -> tea != null && tea.getUser() != null)
                    .map(tea -> tea.getUser().getEmployeeProfile() != null 
                            ? tea.getUser().getEmployeeProfile().getFullName() 
                            : tea.getUser().getUserCode())
                    .distinct()
                    .collect(Collectors.toList());

            LocalDate productionStartDate = jobAssignments.stream()
                    .map(TaskJobAssignment::getTask)
                    .map(Task::getAssignedDate)
                    .filter(Objects::nonNull)
                    .min(LocalDate::compareTo)
                    .orElse(null);

            return toResponse(job, getCombinedEmployees(job, employees), productionStartDate, processes);
        });
    }

    // ─────────────────────────────────────────────
    // GET BY ID
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public JobResponse getJobById(UUID id) {
        Job job = findJob(id);
        List<TaskJobAssignment> assignments = taskJobAssignmentRepository.findAssignmentsByJobIds(List.of(job.getId()));
        List<String> processes = List.of();
        if (job.getProject() != null) {
            processes = taskRepository.findProcessNamesByProjectId(job.getProject().getId());
        }
        List<String> employees = assignments.stream()
                .map(TaskJobAssignment::getTask)
                .flatMap(task -> task.getEmployeeAssignments().stream())
                .filter(tea -> tea != null && tea.getUser() != null)
                .map(tea -> tea.getUser().getEmployeeProfile() != null 
                        ? tea.getUser().getEmployeeProfile().getFullName() 
                        : tea.getUser().getUserCode())
                .distinct()
                .collect(Collectors.toList());
        LocalDate productionStartDate = assignments.stream()
                .map(TaskJobAssignment::getTask)
                .map(Task::getAssignedDate)
                .filter(Objects::nonNull)
                .min(LocalDate::compareTo)
                .orElse(null);
        return toResponse(job, getCombinedEmployees(job, employees), productionStartDate, processes);
    }

    // ─────────────────────────────────────────────
    // GET BY PROJECT
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<JobResponse> getJobsByProject(UUID projectId) {
        List<String> processes = taskRepository.findProcessNamesByProjectId(projectId);
        return jobRepository.findByProjectIdOrderByReceiveDateDesc(projectId)
                .stream()
                .map(job -> toResponse(job, null, null, processes))
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET AVAILABLE FOR TASK
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<JobResponse> getAvailableJobsForTask(UUID projectId) {
        List<String> processes = taskRepository.findProcessNamesByProjectId(projectId);
        return jobRepository.findAvailableJobsForTask(projectId)
                .stream()
                .map(job -> toResponse(job, null, null, processes))
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // CREATE JOB
    // ─────────────────────────────────────────────
    @Transactional
    public JobResponse createJob(CreateJobRequest request) {

        if (request.getProjectId() == null) {
            throw new BadRequestException("Project is required.");
        }

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Project", "id", request.getProjectId()));

        if (request.getJobIdCode() == null || request.getJobIdCode().trim().isBlank()) {
            throw new BadRequestException("Job ID is required.");
        }

        // Per-project uniqueness (matches DB constraint)
        if (jobRepository.existsByProjectIdAndJobIdCode(
                project.getId(), request.getJobIdCode().trim())) {
            throw new BadRequestException(
                    "Job ID '" + request.getJobIdCode().trim()
                            + "' already exists for project '"
                            + project.getName() + "'.");
        }

        User currentUser = getCurrentUserOrNull();

        Workflow workflow = null;
        if (request.getWorkflowId() != null) {
            workflow = workflowRepository.findById(request.getWorkflowId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Workflow", "id", request.getWorkflowId()));
        }

        Job job = Job.builder()
                .project(project)
                .workflow(workflow)
                .jobIdCode(request.getJobIdCode() != null && !request.getJobIdCode().isBlank() ? request.getJobIdCode().trim() : null)
                .xmlIsbn(request.getXmlIsbn())
                .batch(request.getBatch())
                .titleName(request.getTitleName().trim())
                .pageCount(request.getPageCount())
                .numberOfChapters(request.getNumberOfChapters())
                .pdfInputType(request.getPdfInputType())
                .complexity(request.getComplexity())
                .referenceType(request.getReferenceType())
                .status(request.getStatus() != null
                        ? request.getStatus() : "PENDING")
                .fileStatus(request.getFileStatus())
                .uploadDate(request.getUploadDate())
                .billingStatus(request.getBillingStatus() != null
                        ? request.getBillingStatus() : "PENDING")
                .receiveDate(request.getReceiveDate())
                .startMonth(request.getStartMonth())
                .endMonth(request.getEndMonth())
                .language(request.getLanguage() != null ? request.getLanguage().trim() : null)
                .createdBy(currentUser)
                .build();

        job = jobRepository.save(job);
        logAction("CREATE", job);
        List<String> processes = taskRepository.findProcessNamesByProjectId(project.getId());
        return toResponse(job, null, null, processes);
    }

    // ─────────────────────────────────────────────
    // UPDATE JOB
    // ─────────────────────────────────────────────
    @Transactional
    public JobResponse updateJob(UUID id, CreateJobRequest request) {

        Job job = findJob(id);

        if (request.getJobIdCode() == null || request.getJobIdCode().trim().isBlank()) {
            throw new BadRequestException("Job ID is required.");
        }

        String requestJobId = request.getJobIdCode().trim();
        if ((job.getJobIdCode() == null || !job.getJobIdCode().equals(requestJobId))
                && jobRepository.existsByProjectIdAndJobIdCode(job.getProject().getId(), requestJobId)) {
            throw new BadRequestException("Job ID '" + requestJobId + "' already exists.");
        }

        if (request.getProjectId() != null
                && !job.getProject().getId().equals(request.getProjectId())) {
            Project project = projectRepository.findById(
                            request.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Project", "id", request.getProjectId()));
            job.setProject(project);
        }

        if (request.getJobIdCode()       != null) {
            job.setJobIdCode(request.getJobIdCode().trim().isBlank() ? null : request.getJobIdCode().trim());
        }
        if (request.getXmlIsbn()         != null) job.setXmlIsbn(request.getXmlIsbn());
        if (request.getBatch()           != null) job.setBatch(request.getBatch());
        if (request.getTitleName()       != null) job.setTitleName(request.getTitleName().trim());
        if (request.getPageCount()       != null) job.setPageCount(request.getPageCount());
        if (request.getNumberOfChapters()!= null) job.setNumberOfChapters(request.getNumberOfChapters());
        if (request.getPdfInputType()    != null) job.setPdfInputType(request.getPdfInputType());
        if (request.getComplexity()      != null) job.setComplexity(request.getComplexity());
        if (request.getReferenceType()   != null) job.setReferenceType(request.getReferenceType());
        if (request.getStatus()          != null) job.setStatus(request.getStatus());
        if (request.getFileStatus()      != null) job.setFileStatus(request.getFileStatus());
        if (request.getUploadDate()      != null) job.setUploadDate(request.getUploadDate());
        if (request.getBillingStatus()   != null) job.setBillingStatus(request.getBillingStatus());
        if (request.getReceiveDate()     != null) job.setReceiveDate(request.getReceiveDate());
        if (request.getStartMonth()      != null) job.setStartMonth(request.getStartMonth());
        if (request.getEndMonth()        != null) job.setEndMonth(request.getEndMonth());
        if (request.getLanguage()        != null) job.setLanguage(request.getLanguage().trim());

        if (request.getWorkflowId() != null) {
            Workflow workflow = workflowRepository.findById(request.getWorkflowId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Workflow", "id", request.getWorkflowId()));
            job.setWorkflow(workflow);
        } else {
            job.setWorkflow(null);
        }

        job.setUpdatedAt(OffsetDateTime.now());
        job = jobRepository.save(job);

        logAction("UPDATE", job);
        List<String> processes = taskRepository.findProcessNamesByProjectId(job.getProject().getId());
        return toResponse(job, null, null, processes);
    }

    // ─────────────────────────────────────────────
    // DELETE JOB (Clean Soft Delete)
    // ─────────────────────────────────────────────
    @Transactional
    public void deleteJob(UUID id) {
        Job job = findJob(id);

        // No suffixing needed! The database's Partial Index handles the collision natively.
        job.setDeletedAt(OffsetDateTime.now());
        job.setUpdatedAt(OffsetDateTime.now());

        jobRepository.save(job);

        logAction("DELETE", job);
        log.info("Job soft-deleted: {}", job.getJobIdCode());
    }

    // ─────────────────────────────────────────────
    // SAVE FIELD MAPPING (JSONB — single row per project)
    // ─────────────────────────────────────────────
    @Transactional
    public void saveFieldMapping(UUID projectId, List<String> fieldOrder) {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Project", "id", projectId));

        String fieldOrderJson;
        try {
            fieldOrderJson = objectMapper.writeValueAsString(fieldOrder);
        } catch (Exception e) {
            throw new BadRequestException(
                    "Could not serialize field order: " + e.getMessage());
        }

        ImportFieldMapping mapping = fieldMappingRepository
                .findByProjectId(projectId)
                .orElse(ImportFieldMapping.builder()
                        .project(project)
                        .createdBy(getCurrentUserOrNull())
                        .build());

        mapping.setFieldOrder(fieldOrderJson);
        mapping.setUpdatedAt(OffsetDateTime.now());
        fieldMappingRepository.save(mapping);

        log.info("Field mapping saved for project {} ({} fields)",
                project.getName(), fieldOrder.size());
    }

    // ─────────────────────────────────────────────
    // GET FIELD MAPPING
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<String> getFieldMapping(UUID projectId) {
        return fieldMappingRepository.findByProjectId(projectId)
                .map(m -> {
                    try {
                        return objectMapper.<List<String>>readValue(
                                m.getFieldOrder(),
                                new TypeReference<>() {});
                    } catch (Exception e) {
                        log.warn("Could not parse field mapping for {}: {}",
                                projectId, e.getMessage());
                        return defaultFieldOrder();
                    }
                })
                .orElse(defaultFieldOrder());
    }

    // ─────────────────────────────────────────────
    // BULK IMPORT
    // ─────────────────────────────────────────────
    @Transactional
    public BulkImportResponse bulkImport(BulkImportRequest request) {

        if (request.getRows() == null || request.getRows().isEmpty()) {
            throw new BadRequestException("No rows to import.");
        }
        if (request.getProjectId() == null) {
            throw new BadRequestException("Project is required.");
        }

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Project", "id", request.getProjectId()));

        List<String> fieldOrder = request.getFieldOrder();
        if (fieldOrder == null || fieldOrder.isEmpty()) {
            fieldOrder = getFieldMapping(request.getProjectId());
        }

        User currentUser = getCurrentUserOrNull();

        String fieldOrderJson;
        try {
            fieldOrderJson = objectMapper.writeValueAsString(fieldOrder);
        } catch (Exception e) {
            fieldOrderJson = "[]";
        }

        ImportBatch batch = ImportBatch.builder()
                .project(project)
                .importedBy(currentUser)
                .totalRows(request.getRows().size())
                .status("Processing")
                .fieldMappingUsed(fieldOrderJson)
                .build();
        batch = importBatchRepository.save(batch);

        List<BulkImportResponse.RowError> errors = new ArrayList<>();
        int successCount = 0;

        Workflow selectedWorkflow = null;
        if (request.getWorkflowId() != null) {
            selectedWorkflow = workflowRepository.findById(request.getWorkflowId())
                    .orElseThrow(() -> new ResourceNotFoundException("Workflow", "id", request.getWorkflowId()));
        }

        // HIGH-PERFORMANCE FIX: Load existing Job IDs into memory to prevent transaction death
        Set<String> existingJobIds = jobRepository.findByProjectIdOrderByReceiveDateDesc(project.getId())
                .stream()
                .map(Job::getJobIdCode)
                .filter(id -> id != null && !id.isBlank())
                .collect(Collectors.toSet());

        for (int i = 0; i < request.getRows().size(); i++) {
            List<String> row = request.getRows().get(i);
            int rowNum = i + 1;

            try {
                Job job = mapRowToJob(row, fieldOrder, project);

                // 1. Safe In-Memory Validation (Prevents Postgres 25P02 error)
                if (job.getJobIdCode() != null && !job.getJobIdCode().isBlank() && existingJobIds.contains(job.getJobIdCode())) {
                    errors.add(BulkImportResponse.RowError.builder()
                            .rowNumber(rowNum)
                            .field("jobId")
                            .message("Job ID '" + job.getJobIdCode() + "' already exists in this project - skipped.")
                            .build());
                    continue; // Skip safely without throwing an exception
                }

                if (selectedWorkflow != null) {
                    job.setWorkflow(selectedWorkflow);
                }

                // 2. Safe Database Save
                job.setImportBatch(batch);
                job.setCreatedBy(currentUser);
                job.setUpdatedAt(OffsetDateTime.now());
                jobRepository.save(job);

                // 3. Add to local set to catch duplicates within the pasted data itself
                if (job.getJobIdCode() != null && !job.getJobIdCode().isBlank()) {
                    existingJobIds.add(job.getJobIdCode());
                }
                successCount++;

            } catch (Exception e) {
                errors.add(BulkImportResponse.RowError.builder()
                        .rowNumber(rowNum)
                        .field("row")
                        .message(e.getMessage())
                        .build());
                log.warn("Row {} import failed: {}", rowNum, e.getMessage());
            }
        }

        String errorJson = null;
        if (!errors.isEmpty()) {
            try {
                errorJson = objectMapper.writeValueAsString(errors);
            } catch (Exception ignored) {}
        }

        batch.setSuccessfulRows(successCount);
        batch.setFailedRows(errors.size());

        // BOUNDARY LIMIT FIX: Fits exactly within VARCHAR(20)
        batch.setStatus(errors.isEmpty() ? "Completed" : "Partial Success");

        batch.setErrorDetails(errorJson);
        batch.setUpdatedAt(OffsetDateTime.now());
        importBatchRepository.save(batch);

        if (currentUser != null) {
            activityLogService.log(currentUser, "BULK_IMPORT", "jobs",
                    batch.getId(),
                    successCount + "/" + request.getRows().size()
                            + " rows for " + project.getName(),
                    null);
        }

        log.info("Bulk import: {}/{} rows for project {}",
                successCount, request.getRows().size(), project.getName());

        return BulkImportResponse.builder()
                .batchId(batch.getId())
                .totalRows(request.getRows().size())
                .successfulRows(successCount)
                .failedRows(errors.size())
                .status(batch.getStatus())
                .errors(errors)
                .build();
    }

    // ─────────────────────────────────────────────
    // ROLLBACK BATCH
    // ─────────────────────────────────────────────
    @Transactional
    public void rollbackBatch(UUID batchId) {
        ImportBatch batch = importBatchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ImportBatch", "id", batchId));

        if (Boolean.TRUE.equals(batch.getIsRolledBack())) {
            throw new BadRequestException(
                    "This batch has already been rolled back.");
        }

        // Soft delete all jobs from this batch
        List<Job> batchJobs = jobRepository.findByImportBatchId(batchId);
        OffsetDateTime now = OffsetDateTime.now();
        for (Job job : batchJobs) {
            job.setDeletedAt(now);
            job.setUpdatedAt(now);
        }
        jobRepository.saveAll(batchJobs);

        User currentUser = getCurrentUserOrNull();
        batch.setIsRolledBack(true);
        batch.setRolledBackBy(currentUser);
        batch.setRolledBackAt(now);
        batch.setStatus("Rolled Back");
        batch.setUpdatedAt(now);
        importBatchRepository.save(batch);

        log.info("Rolled back batch {}: {} jobs soft-deleted",
                batchId, batchJobs.size());
    }

    // ─────────────────────────────────────────────
    // SEARCH PRODUCTION JOBS
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<JobResponse> searchProductionJobs(UUID projectId,
                                                  LocalDate startDate,
                                                  LocalDate endDate,
                                                  int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Job> jobs = jobRepository.searchProductionJobs(projectId, startDate, endDate, pageable);

        if (jobs.isEmpty()) {
            return Page.empty(pageable);
        }

        List<UUID> jobIds = jobs.getContent().stream().map(Job::getId).collect(Collectors.toList());

        // Fetch task-job assignments for these jobs to find employees and start date
        List<TaskJobAssignment> assignments = taskJobAssignmentRepository.findAssignmentsByJobIds(jobIds);

        // Group assignments by Job ID
        Map<UUID, List<TaskJobAssignment>> assignmentsByJobId = assignments.stream()
                .collect(Collectors.groupingBy(tja -> tja.getJob().getId()));

        List<UUID> projectIds = jobs.getContent().stream()
                .map(j -> j.getProject() != null ? j.getProject().getId() : null)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<UUID, List<String>> processesByProjectId = getProcessesByProjectIds(projectIds);

        return jobs.map(job -> {
            List<TaskJobAssignment> jobAssignments = assignmentsByJobId.getOrDefault(job.getId(), List.of());

            // Get unique employees assigned to tasks
            List<String> employees = jobAssignments.stream()
                    .map(TaskJobAssignment::getTask)
                    .flatMap(task -> task.getEmployeeAssignments().stream())
                    .filter(tea -> tea != null && tea.getUser() != null)
                    .map(tea -> tea.getUser().getEmployeeProfile() != null 
                            ? tea.getUser().getEmployeeProfile().getFullName() 
                            : tea.getUser().getUserCode())
                    .distinct()
                    .collect(Collectors.toList());

            // Earliest assigned date of tasks
            LocalDate productionStartDate = jobAssignments.stream()
                    .map(TaskJobAssignment::getTask)
                    .map(Task::getAssignedDate)
                    .filter(Objects::nonNull)
                    .min(LocalDate::compareTo)
                    .orElse(null);

            List<String> processes = processesByProjectId.getOrDefault(
                    job.getProject() != null ? job.getProject().getId() : null,
                    List.of()
            );

            return toResponse(job, getCombinedEmployees(job, employees), productionStartDate, processes);
        });
    }

    // ─────────────────────────────────────────────
    // UPDATE PRODUCTION STATUS
    // ─────────────────────────────────────────────
    @Transactional
    public JobResponse updateProductionStatus(UUID id, UpdateProductionRequest request) {
        Job job = findJob(id);

        if (request.getProcessStatus() != null) {
            job.setProcessStatus(request.getProcessStatus());
        }
        if (request.getQcStatus() != null) {
            job.setQcStatus(request.getQcStatus());
        }
        // Always copy, since endDate can be set to null or cleared
        job.setEndDate(request.getEndDate());

        if (request.getEmployees() != null) {
            String joined = request.getEmployees().stream()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.joining(","));
            job.setEmployeeNames(joined.isEmpty() ? null : joined);
        }

        job.setUpdatedAt(OffsetDateTime.now());
        job = jobRepository.save(job);

        logAction("UPDATE", job);

        // Fetch task-job assignments for this job to compute employees and start date
        List<TaskJobAssignment> assignments = taskJobAssignmentRepository.findAssignmentsByJobIds(List.of(job.getId()));

        List<String> employees = assignments.stream()
                .map(TaskJobAssignment::getTask)
                .flatMap(task -> task.getEmployeeAssignments().stream())
                .filter(tea -> tea != null && tea.getUser() != null)
                .map(tea -> tea.getUser().getEmployeeProfile() != null 
                        ? tea.getUser().getEmployeeProfile().getFullName() 
                        : tea.getUser().getUserCode())
                .distinct()
                .collect(Collectors.toList());

        LocalDate productionStartDate = assignments.stream()
                .map(TaskJobAssignment::getTask)
                .map(Task::getAssignedDate)
                .filter(Objects::nonNull)
                .min(LocalDate::compareTo)
                .orElse(null);

        List<String> processes = List.of();
        if (job.getProject() != null) {
            processes = taskRepository.findProcessNamesByProjectId(job.getProject().getId());
        }

        return toResponse(job, getCombinedEmployees(job, employees), productionStartDate, processes);
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────

    private Job mapRowToJob(List<String> row, List<String> fieldOrder,
                            Project project) {
        Job.JobBuilder builder = Job.builder()
                .project(project)
                .status("PENDING")
                .billingStatus("PENDING");

        for (int i = 0; i < fieldOrder.size() && i < row.size(); i++) {
            String field = fieldOrder.get(i);
            String value = row.get(i) != null ? row.get(i).trim() : "";
            if (value.isEmpty()) continue;

            switch (field) {
                case "jobId"       -> builder.jobIdCode(value);
                case "title"       -> builder.titleName(value);
                case "isbn"        -> builder.xmlIsbn(value);
                case "batch"       -> builder.batch(value);
                case "pageCount"   -> {
                    try { builder.pageCount(Integer.parseInt(
                            value.replace(",", ""))); }
                    catch (NumberFormatException ignored) {}
                }
                case "chapters"    -> {
                    try { builder.numberOfChapters(Integer.parseInt(
                            value.replace(",", ""))); }
                    catch (NumberFormatException ignored) {}
                }
                case "pdfType"     -> builder.pdfInputType(value);
                case "complexity"  -> builder.complexity(value);
                case "refType"     -> builder.referenceType(value);
                case "status"      -> builder.status(value);
                case "fileStatus"  -> builder.fileStatus(value);
                case "billing"     -> builder.billingStatus(value);
                case "receiveDate" -> builder.receiveDate(parseDateOrNull(value));
                case "uploadDate"  -> builder.uploadDate(parseDateOrNull(value));
                case "startMonth"  -> builder.startMonth(parseDateOrNull(value));
                case "endMonth"    -> builder.endMonth(parseDateOrNull(value));
                case "language"    -> builder.language(value);
            }
        }

        Job job = builder.build();

        // Validate mandatory fields
        if (job.getJobIdCode() == null || job.getJobIdCode().isBlank()) {
            throw new BadRequestException("Job ID is required");
        }
        if (job.getTitleName() == null || job.getTitleName().isBlank()) {
            throw new BadRequestException("Title name is required");
        }

        // Note: Duplicate checking is now handled safely inside bulkImport()
        // to prevent Postgres 25P02 Transaction Abort errors.

        return job;
    }

    private LocalDate parseDateOrNull(String value) {
        if (value == null || value.isBlank()) return null;
        String[] formats = {
                "yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy",
                "dd-MM-yyyy", "d/M/yyyy",   "yyyy/MM/dd"
        };
        for (String fmt : formats) {
            try {
                return LocalDate.parse(value,
                        DateTimeFormatter.ofPattern(fmt));
            } catch (DateTimeParseException ignored) {}
        }
        log.warn("Could not parse date '{}' — skipping", value);
        return null;
    }

    private List<String> defaultFieldOrder() {
        return List.of("receiveDate", "jobId", "title", "pageCount");
    }

    private String emptyToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }

    private void logAction(String action, Job job) {
        try {
            UUID uid = SecurityUtils.getCurrentUserId();
            userRepository.findByIdWithProfile(uid)
                    .ifPresent(user -> activityLogService.log(
                            user, action, "job",
                            job.getId(), job.getJobIdCode(), null));
        } catch (Exception e) {
            log.warn("Could not log activity: {}", e.getMessage());
        }
    }

    private User getCurrentUserOrNull() {
        try {
            return userRepository
                    .findByIdWithProfile(SecurityUtils.getCurrentUserId())
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private Job findJob(UUID id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Job", "id", id));
    }

    private List<String> getCombinedEmployees(Job job, List<String> taskEmployees) {
        Set<String> allEmps = new LinkedHashSet<>();
        if (taskEmployees != null) {
            allEmps.addAll(taskEmployees);
        }
        if (job.getEmployeeNames() != null && !job.getEmployeeNames().isBlank()) {
            Arrays.stream(job.getEmployeeNames().split(","))
                  .map(String::trim)
                  .filter(s -> !s.isEmpty())
                  .forEach(allEmps::add);
        }
        return new ArrayList<>(allEmps);
    }

    private JobResponse toResponse(Job job) {
        return toResponse(job, null, null, null);
    }

    private JobResponse toResponse(Job job, List<String> employees, LocalDate productionStartDate) {
        return toResponse(job, employees, productionStartDate, null);
    }

    private JobResponse toResponse(Job job, List<String> employees, LocalDate productionStartDate, List<String> processes) {
        return JobResponse.builder()
                .id(job.getId())
                .projectId(job.getProject() != null
                        ? job.getProject().getId() : null)
                .projectName(job.getProject() != null
                        ? job.getProject().getName() : null)
                .jobIdCode(job.getJobIdCode())
                .xmlIsbn(job.getXmlIsbn())
                .batch(job.getBatch())
                .titleName(job.getTitleName())
                .pageCount(job.getPageCount())
                .numberOfChapters(job.getNumberOfChapters())
                .pdfInputType(job.getPdfInputType())
                .complexity(job.getComplexity())
                .referenceType(job.getReferenceType())
                .status(job.getStatus())
                .fileStatus(job.getFileStatus())
                .uploadDate(job.getUploadDate())
                .billingStatus(job.getBillingStatus())
                .receiveDate(job.getReceiveDate())
                .startMonth(job.getStartMonth())
                .endMonth(job.getEndMonth())
                .importBatchId(job.getImportBatch() != null
                        ? job.getImportBatch().getId() : null)
                .createdAt(job.getCreatedAt())
                .processStatus(job.getProcessStatus())
                .qcStatus(job.getQcStatus())
                .endDate(job.getEndDate())
                .employees(employees)
                .productionStartDate(productionStartDate)
                .processes(processes)
                .language(job.getLanguage())
                .workflowId(job.getWorkflow() != null ? job.getWorkflow().getId() : null)
                .workflowName(job.getWorkflow() != null ? job.getWorkflow().getName() : null)
                .clientName(job.getProject() != null && job.getProject().getClient() != null
                        ? job.getProject().getClient().getCompanyName() : null)
                .clientId(job.getProject() != null && job.getProject().getClient() != null
                        ? job.getProject().getClient().getId() : null)
                .build();
    }

    private Map<UUID, List<String>> getProcessesByProjectIds(List<UUID> projectIds) {
        Map<UUID, List<String>> processesByProjectId = new HashMap<>();
        if (projectIds == null || projectIds.isEmpty()) return processesByProjectId;
        List<Object[]> rows = taskRepository.findProcessNamesByProjectIds(projectIds);
        for (Object[] r : rows) {
            UUID pid = (UUID) r[0];
            String procName = (String) r[1];
            processesByProjectId.computeIfAbsent(pid, k -> new ArrayList<>()).add(procName);
        }
        return processesByProjectId;
    }
}


