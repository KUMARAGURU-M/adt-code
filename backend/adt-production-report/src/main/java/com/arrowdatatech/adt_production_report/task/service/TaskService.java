package com.arrowdatatech.adt_production_report.task.service;

import com.arrowdatatech.adt_production_report.common.audit.service.ActivityLogService;
import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.job.entity.Job;
import com.arrowdatatech.adt_production_report.job.repository.JobRepository;
import com.arrowdatatech.adt_production_report.process.entity.Process;
import com.arrowdatatech.adt_production_report.process.repository.ProcessRepository;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.project.repository.ProjectRepository;
import com.arrowdatatech.adt_production_report.task.dto.*;
import com.arrowdatatech.adt_production_report.task.entity.Task;
import com.arrowdatatech.adt_production_report.task.entity.TaskEmployeeAssignment;
import com.arrowdatatech.adt_production_report.task.entity.TaskJobAssignment;
import com.arrowdatatech.adt_production_report.task.repository.TaskEmployeeAssignmentRepository;
import com.arrowdatatech.adt_production_report.task.repository.TaskJobAssignmentRepository;
import com.arrowdatatech.adt_production_report.task.repository.TaskRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskJobAssignmentRepository taskJobRepository;
    private final TaskEmployeeAssignmentRepository taskEmployeeRepository;
    private final ProjectRepository projectRepository;
    private final ProcessRepository processRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    // ─────────────────────────────────────────────
    // SEARCH TASKS
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<TaskResponse> searchTasks(
            UUID projectId,
            UUID clientId,
            UUID workflowId,
            UUID processId,
            UUID userId,
            String status,
            String search,
            int page, int size) {

        Pageable pageable = PageRequest.of(page, size);
        return taskRepository.searchTasks(
                projectId, clientId, workflowId, processId, userId, status, search, pageable
        ).map(this::toResponse);
    }

    // ─────────────────────────────────────────────
    // GET TASK BY ID
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(UUID id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Task", "id", id));
        return toResponse(task);
    }

    // ─────────────────────────────────────────────
    // GET TASKS FOR EMPLOYEE
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksForEmployee(UUID userId) {
        return taskRepository.findAllByAssignedUserId(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // CREATE TASK
    // ─────────────────────────────────────────────
    @Transactional
    public TaskResponse createTask(CreateTaskRequest request) {

        Project project = null;
        if (request.getProjectId() != null) {
            project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Project", "id", request.getProjectId()));
        }

        Process primaryProcess = null;
        if (request.getProcessIds() != null
                && !request.getProcessIds().isEmpty()) {
            primaryProcess = processRepository
                    .findById(request.getProcessIds().get(0))
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Process", "id",
                            request.getProcessIds().get(0)));
        }

        User assignedBy = null;
        if (request.getAssignedBy() != null) {
            assignedBy = userRepository
                    .findByIdWithProfile(request.getAssignedBy())
                    .orElse(null);
        }

        String title = request.getTaskTitle();
        if (title == null || title.isBlank()) {
            title = autoGenerateTitle(project, primaryProcess, request);
        }

        // FIX: default to "PENDING" (uppercase) to match DB CHECK constraint.
        // The DB constraint on tasks.status is:
        // ('FINISH','WIP','YTS','RTU','UPLOADED','PENDING','HOLD','QUERY')
        String status = request.getStatus();
        if (status == null || status.isBlank()) {
            status = "PENDING";
        }

        Task task = Task.builder()
                .project(project)
                .process(primaryProcess)
                .taskTitle(title)
                .description(request.getDescription())
                .status(status)
                .assignedDate(LocalDate.now())
                .dueDate(request.getDueDate())
                .assignedPages(request.getAssignedPages())
                .assignedPagesStr(request.getAssignedPagesStr())
                .complexity(request.getComplexity())
                .chapterArticleBatch(request.getChapterArticleBatch())
                .estimateHours(request.getEstimateHours() != null
                        ? request.getEstimateHours()
                        : BigDecimal.ZERO)
                .serverPath(request.getServerPath())
                .assignedBy(assignedBy)
                .totalPages(request.getTotalPages())
                .build();

        task = taskRepository.save(task);

        // Link jobs to task
        if (request.getJobAssignments() != null) {
            for (CreateTaskRequest.JobAssignment ja
                    : request.getJobAssignments()) {
                Job job = jobRepository.findById(ja.getJobId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Job", "id", ja.getJobId()));
                TaskJobAssignment tja = TaskJobAssignment.builder()
                        .task(task)
                        .job(job)
                        .assignedPages(ja.getAssignedPages())
                        .build();
                taskJobRepository.save(tja);
            }
        }

        // Link employees to task
        if (request.getEmployeeAssignments() != null) {
            for (CreateTaskRequest.EmployeeAssignment ea
                    : request.getEmployeeAssignments()) {
                User user = userRepository
                        .findByIdWithProfile(ea.getUserId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "User", "id", ea.getUserId()));
                TaskEmployeeAssignment tea =
                        TaskEmployeeAssignment.builder()
                                .task(task)
                                .user(user)
                                .assignedPages(ea.getAssignedPages())
                                .status("Pending")    // valid DB value
                                .updatedAt(OffsetDateTime.now())
                                .build();
                taskEmployeeRepository.save(tea);
            }
        }

        logAction("CREATE", task);
        log.info("Task created: {}", task.getTaskTitle());

        return toResponse(taskRepository.findById(task.getId()).orElseThrow());
    }

    // ─────────────────────────────────────────────
    // UPDATE TASK
    // ─────────────────────────────────────────────
    @Transactional
    public TaskResponse updateTask(UUID id, CreateTaskRequest request) {

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Task", "id", id));

        if (request.getProjectId() != null) {
            Project project = projectRepository
                    .findById(request.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Project", "id", request.getProjectId()));
            task.setProject(project);
        }

        if (request.getProcessIds() != null
                && !request.getProcessIds().isEmpty()) {
            processRepository.findById(request.getProcessIds().get(0))
                    .ifPresent(task::setProcess);
        }

        if (request.getAssignedBy() != null) {
            userRepository.findByIdWithProfile(request.getAssignedBy())
                    .ifPresent(task::setAssignedBy);
        }

        if (request.getTaskTitle() != null
                && !request.getTaskTitle().isBlank()) {
            task.setTaskTitle(request.getTaskTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        if (request.getAssignedPages() != null) {
            task.setAssignedPages(request.getAssignedPages());
        }
        if (request.getAssignedPagesStr() != null) {
            task.setAssignedPagesStr(request.getAssignedPagesStr());
        }
        if (request.getComplexity() != null) {
            task.setComplexity(request.getComplexity());
        }
        if (request.getChapterArticleBatch() != null) {
            task.setChapterArticleBatch(request.getChapterArticleBatch());
        }
        if (request.getEstimateHours() != null) {
            task.setEstimateHours(request.getEstimateHours());
        }
        if (request.getServerPath() != null) {
            task.setServerPath(request.getServerPath());
        }
        if (request.getTotalPages() != null) {
            task.setTotalPages(request.getTotalPages());
        }

        task.setUpdatedAt(OffsetDateTime.now());
        task = taskRepository.save(task);

        if (request.getJobAssignments() != null) {
            taskJobRepository.deleteByTaskId(id);
            for (CreateTaskRequest.JobAssignment ja
                    : request.getJobAssignments()) {
                Job job = jobRepository.findById(ja.getJobId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Job", "id", ja.getJobId()));
                TaskJobAssignment tja = TaskJobAssignment.builder()
                        .task(task)
                        .job(job)
                        .assignedPages(ja.getAssignedPages())
                        .build();
                taskJobRepository.save(tja);
            }
        }

        if (request.getEmployeeAssignments() != null) {
            taskEmployeeRepository.deleteByTaskId(id);
            for (CreateTaskRequest.EmployeeAssignment ea
                    : request.getEmployeeAssignments()) {
                User user = userRepository
                        .findByIdWithProfile(ea.getUserId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "User", "id", ea.getUserId()));
                TaskEmployeeAssignment tea =
                        TaskEmployeeAssignment.builder()
                                .task(task)
                                .user(user)
                                .assignedPages(ea.getAssignedPages())
                                .status("Pending")
                                .updatedAt(OffsetDateTime.now())
                                .build();
                taskEmployeeRepository.save(tea);
            }
        }

        logAction("UPDATE", task);
        return toResponse(taskRepository.findById(id).orElseThrow());
    }

    // ─────────────────────────────────────────────
    // UPDATE TASK STATUS ONLY
    // ─────────────────────────────────────────────
    @Transactional
    public TaskResponse updateTaskStatus(UUID id, String status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Task", "id", id));
        task.setStatus(status);
        task.setUpdatedAt(OffsetDateTime.now());
        taskRepository.save(task);
        return toResponse(task);
    }

    // ─────────────────────────────────────────────
    // DELETE TASK
    // ─────────────────────────────────────────────
    @Transactional
    public void deleteTask(UUID id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Task", "id", id));

        taskJobRepository.deleteByTaskId(id);
        taskEmployeeRepository.deleteByTaskId(id);

        // Soft-delete: set deletedAt so @SQLRestriction("deleted_at IS NULL") hides it.
        // Hard deleteById() would violate the entity's soft-delete contract and can
        // break subsequent queries that JOIN through this task's FK relations.
        task.setDeletedAt(OffsetDateTime.now());
        taskRepository.save(task);

        logAction("DELETE", task);
        log.info("Task soft-deleted: {}", task.getTaskTitle());
    }

    // ─────────────────────────────────────────────
    // REMOVE DUPLICATE TASKS
    // ─────────────────────────────────────────────
    @Transactional
    public int removeDuplicates() {
        List<Task> all = taskRepository.findAll();
        int removed = 0;
        java.util.Set<String> seen = new java.util.HashSet<>();

        for (Task task : all) {
            String key = task.getTaskTitle() + "|"
                    + (task.getProject() != null
                    ? task.getProject().getId() : "")
                    + "|" + (task.getProcess() != null
                    ? task.getProcess().getId() : "");
            if (!seen.add(key)) {
                taskJobRepository.deleteByTaskId(task.getId());
                taskEmployeeRepository.deleteByTaskId(task.getId());
                taskRepository.deleteById(task.getId());
                removed++;
            }
        }
        log.info("Removed {} duplicate tasks", removed);
        return removed;
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────

    private String autoGenerateTitle(Project project,
                                     Process process,
                                     CreateTaskRequest request) {
        StringBuilder sb = new StringBuilder();
        if (process != null) sb.append(process.getName());
        if (request.getJobAssignments() != null
                && !request.getJobAssignments().isEmpty()) {
            try {
                UUID firstJobId = request.getJobAssignments()
                        .get(0).getJobId();
                jobRepository.findById(firstJobId).ifPresent(job -> {
                    if (job.getXmlIsbn() != null) {
                        sb.append(" - ").append(job.getXmlIsbn());
                    } else {
                        sb.append(" - ").append(job.getJobIdCode());
                    }
                });
            } catch (Exception ignored) { /* skip */ }
        }
        if (project != null) sb.append(" - ").append(project.getName());
        return sb.toString().isBlank()
                ? "Task-" + System.currentTimeMillis()
                : sb.toString();
    }

    private void logAction(String action, Task task) {
        try {
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            userRepository.findByIdWithProfile(currentUserId)
                    .ifPresent(user -> activityLogService.log(
                            user, action, "task",
                            task.getId(), task.getTaskTitle(), null));
        } catch (Exception e) {
            log.warn("Could not log activity: {}", e.getMessage());
        }
    }

    private TaskResponse toResponse(Task task) {
        List<TaskResponse.JobInfo> jobs = taskJobRepository
                .findByTaskId(task.getId())
                .stream()
                .filter(tja -> tja != null && tja.getJob() != null)
                .map(tja -> TaskResponse.JobInfo.builder()
                        .jobId(tja.getJob().getId())
                        .jobIdCode(tja.getJob().getJobIdCode())
                        .titleName(tja.getJob().getTitleName())
                        .xmlIsbn(tja.getJob().getXmlIsbn())
                        .assignedPages(tja.getAssignedPages())
                        .pageCount(tja.getJob().getPageCount())
                        .build())
                .collect(Collectors.toList());

        List<TaskResponse.EmployeeInfo> employees = taskEmployeeRepository
                .findByTaskId(task.getId())
                .stream()
                .filter(tea -> tea != null && tea.getUser() != null)
                .map(tea -> {
                    String fullName = tea.getUser().getEmployeeProfile() != null
                            ? tea.getUser().getEmployeeProfile().getFullName()
                            : tea.getUser().getEmail();
                    return TaskResponse.EmployeeInfo.builder()
                            .userId(tea.getUser().getId())
                            .fullName(fullName)
                            .assignedPages(tea.getAssignedPages())
                            .pagesCompleted(tea.getPagesCompleted())
                            .status(tea.getStatus())
                            .build();
                })
                .collect(Collectors.toList());

        String assignedByName = null;
        if (task.getAssignedBy() != null) {
            assignedByName = task.getAssignedBy().getEmployeeProfile() != null
                    ? task.getAssignedBy().getEmployeeProfile().getFullName()
                    : task.getAssignedBy().getEmail();
        }

        UUID clientId = null;
        String clientName = null;
        UUID workflowId = null;
        String workflowName = null;
        if (task.getProject() != null) {
            if (task.getProject().getClient() != null) {
                clientId = task.getProject().getClient().getId();
                clientName = task.getProject().getClient().getCompanyName();
            }
            if (task.getProject().getWorkflow() != null) {
                workflowId = task.getProject().getWorkflow().getId();
                workflowName = task.getProject().getWorkflow().getName();
            }
        }

        return TaskResponse.builder()
                .id(task.getId())
                .projectId(task.getProject() != null
                        ? task.getProject().getId() : null)
                .projectName(task.getProject() != null
                        ? task.getProject().getName() : null)
                .processId(task.getProcess() != null
                        ? task.getProcess().getId() : null)
                .processName(task.getProcess() != null
                        ? task.getProcess().getName() : null)
                .taskTitle(task.getTaskTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .assignedDate(task.getAssignedDate())
                .dueDate(task.getDueDate())
                .assignedPages(task.getAssignedPages())
                .assignedPagesStr(task.getAssignedPagesStr())
                .complexity(task.getComplexity())
                .chapterArticleBatch(task.getChapterArticleBatch())
                .estimateHours(task.getEstimateHours())
                .serverPath(task.getServerPath())
                .assignedByName(assignedByName)
                .totalPages(task.getTotalPages())
                .createdAt(task.getCreatedAt())
                .clientId(clientId)
                .clientName(clientName)
                .workflowId(workflowId)
                .workflowName(workflowName)
                .jobs(jobs)
                .employees(employees)
                .build();
    }
}
