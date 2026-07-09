package com.arrowdatatech.adt_production_report.workwise.service;

import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceEmployee;
import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceRecord;
import com.arrowdatatech.adt_production_report.attendance.repository.AttendanceEmployeeRepository;
import com.arrowdatatech.adt_production_report.attendance.repository.AttendanceRecordRepository;
import com.arrowdatatech.adt_production_report.common.audit.service.ActivityLogService;
import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.job.repository.JobRepository;
import com.arrowdatatech.adt_production_report.process.entity.Process;
import com.arrowdatatech.adt_production_report.process.repository.ProcessRepository;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.project.repository.ProjectRepository;
import com.arrowdatatech.adt_production_report.shift.entity.Shift;
import com.arrowdatatech.adt_production_report.shift.repository.ShiftUserAssignmentRepository;
import com.arrowdatatech.adt_production_report.task.entity.Task;
import com.arrowdatatech.adt_production_report.task.entity.TaskEmployeeAssignment;
import com.arrowdatatech.adt_production_report.task.entity.TaskJobAssignment;
import com.arrowdatatech.adt_production_report.task.repository.TaskEmployeeAssignmentRepository;
import com.arrowdatatech.adt_production_report.task.repository.TaskJobAssignmentRepository;
import com.arrowdatatech.adt_production_report.task.repository.TaskRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import com.arrowdatatech.adt_production_report.workwise.dto.*;
import com.arrowdatatech.adt_production_report.workwise.entity.BreakLog;
import com.arrowdatatech.adt_production_report.workwise.entity.TimeLog;
import com.arrowdatatech.adt_production_report.workwise.repository.BreakLogRepository;
import com.arrowdatatech.adt_production_report.workwise.repository.TimeLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkwiseService {

    private final TimeLogRepository                timeLogRepository;
    private final BreakLogRepository               breakLogRepository;
    private final UserRepository                   userRepository;
    private final ProjectRepository                projectRepository;
    private final ProcessRepository                processRepository;
    private final JobRepository                    jobRepository;
    private final TaskRepository                   taskRepository;
    private final TaskEmployeeAssignmentRepository taskEmployeeRepository;
    private final TaskJobAssignmentRepository      taskJobRepository;
    private final ShiftUserAssignmentRepository    shiftAssignmentRepository;
    private final AttendanceEmployeeRepository attendanceEmployeeRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final ActivityLogService               activityLogService;

    // ─────────────────────────────────────────────
    // GET CURRENT RUNNING TASK
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public WorkwiseContextResponse getCurrentTask(UUID userId) {
        return timeLogRepository
                .findByUserIdAndStatus(userId, "Running")
                .or(() -> timeLogRepository
                        .findByUserIdAndStatus(userId, "On Break"))
                .map(log -> buildContext(log, userId))
                .orElse(null);
    }

    // ─────────────────────────────────────────────
    // GET MY TASK OPTIONS
    // Returns ALL tasks assigned to this user (active + completed).
    // Completed tasks shown in dropdown with isCompleted=true so
    // the frontend can display them greyed out for history reference.
    //
    // BUG FIX: Uses taskJobRepository.findByTaskId() instead of
    //          t.getJobAssignments() to avoid LazyInitializationException.
    // BUG FIX: Only returns THIS user's tasks — filtered by userId in query.
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MyTaskOption> getMyTaskOptions(UUID userId) {
        List<Task> tasks = taskRepository.findAllByAssignedUserId(userId);

        return tasks.stream().map(t -> {
            TaskEmployeeAssignment tea = taskEmployeeRepository
                    .findByTaskIdAndUserId(t.getId(), userId)
                    .orElse(null);

            Integer assignedPages  = tea != null ? tea.getAssignedPages() : null;
            Integer pagesCompleted = tea != null && tea.getPagesCompleted() != null
                    ? tea.getPagesCompleted() : 0;

            boolean isCompleted = tea != null
                    && "Completed".equalsIgnoreCase(tea.getStatus());

            // BUG FIX: use repo method, not lazy collection
            List<TaskJobAssignment> jobLinks =
                    taskJobRepository.findByTaskId(t.getId());

            List<MyTaskOption.JobInfo> jobs = jobLinks.stream()
                    .map(tja -> MyTaskOption.JobInfo.builder()
                            .jobId(tja.getJob().getId())
                            .jobIdCode(tja.getJob().getJobIdCode())
                            .titleName(tja.getJob().getTitleName())
                            .xmlIsbn(tja.getJob().getXmlIsbn())
                            .assignedPages(tja.getAssignedPages())
                            .pageCount(tja.getJob().getPageCount())
                            .build())
                    .collect(Collectors.toList());

            return MyTaskOption.builder()
                    .taskId(t.getId())
                    .taskTitle(t.getTaskTitle())
                    .projectId(t.getProject() != null
                            ? t.getProject().getId() : null)
                    .projectName(t.getProject() != null
                            ? t.getProject().getName() : null)
                    .processId(t.getProcess() != null
                            ? t.getProcess().getId() : null)
                    .processName(t.getProcess() != null
                            ? t.getProcess().getName() : null)
                    .assignedPages(assignedPages)
                    .assignedPagesStr(t.getAssignedPagesStr())
                    .pagesCompleted(pagesCompleted)
                    .dueDate(t.getDueDate() != null
                            ? t.getDueDate().toString() : null)
                    .complexity(t.getComplexity())
                    .chapterArticleBatch(t.getChapterArticleBatch())
                    .isCompleted(isCompleted)
                    .jobs(jobs)
                    .build();
        }).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET NEXT TASK
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public MyTaskOption getNextTask(UUID userId) {
        List<Task> next = taskRepository.findNextTaskForUser(
                userId, PageRequest.of(0, 1));
        if (next.isEmpty()) return null;

        Task t = next.get(0);
        TaskEmployeeAssignment tea = taskEmployeeRepository
                .findByTaskIdAndUserId(t.getId(), userId).orElse(null);

        List<TaskJobAssignment> jobLinks =
                taskJobRepository.findByTaskId(t.getId());

        List<MyTaskOption.JobInfo> jobs = jobLinks.stream()
                .map(tja -> MyTaskOption.JobInfo.builder()
                        .jobId(tja.getJob().getId())
                        .jobIdCode(tja.getJob().getJobIdCode())
                        .titleName(tja.getJob().getTitleName())
                        .xmlIsbn(tja.getJob().getXmlIsbn())
                        .assignedPages(tja.getAssignedPages())
                        .pageCount(tja.getJob().getPageCount())
                        .build())
                .collect(Collectors.toList());

        return MyTaskOption.builder()
                .taskId(t.getId())
                .taskTitle(t.getTaskTitle())
                .projectId(t.getProject() != null
                        ? t.getProject().getId() : null)
                .projectName(t.getProject() != null
                        ? t.getProject().getName() : null)
                .processId(t.getProcess() != null
                        ? t.getProcess().getId() : null)
                .processName(t.getProcess() != null
                        ? t.getProcess().getName() : null)
                .assignedPages(tea != null ? tea.getAssignedPages() : null)
                .assignedPagesStr(t.getAssignedPagesStr())
                .pagesCompleted(tea != null && tea.getPagesCompleted() != null
                        ? tea.getPagesCompleted() : 0)
                .dueDate(t.getDueDate() != null
                        ? t.getDueDate().toString() : null)
                .complexity(t.getComplexity())
                .chapterArticleBatch(t.getChapterArticleBatch())
                .isCompleted(false)
                .jobs(jobs)
                .build();
    }

    // ─────────────────────────────────────────────
    // START TASK
    //
    // RULE: task is mandatory. Project/process/job auto-derived from task.
    // RULE: task must be assigned to this user.
    // RULE: must work on tasks in priority order (earliest-assigned first).
    // RULE: cannot start if already running.
    // ─────────────────────────────────────────────
    @Transactional
    public WorkwiseContextResponse startTask(UUID userId,
                                             StartTaskRequest request) {

        // Block if already running or on break
        boolean alreadyRunning =
                timeLogRepository.existsByUserIdAndStatus(userId, "Running")
                        || timeLogRepository.existsByUserIdAndStatus(userId, "On Break");
        if (alreadyRunning) {
            throw new BadRequestException(
                    "You already have a running task. " +
                            "Stop or resume it before starting a new one.");
        }

        // ── CHECK-IN GUARD ──────────────────────────────────────────
        // Employee must have checked in today before starting any task.
        LocalDate today = LocalDate.now();
        boolean checkedInToday = attendanceEmployeeRepository
                .findByUserId(userId)
                .flatMap(emp -> attendanceRecordRepository
                        .findByEmployeeIdAndAttendanceDate(emp.getId(), today))
                .map(rec -> rec.getCheckInTime() != null)
                .orElse(false);

        if (!checkedInToday) {
            throw new BadRequestException(
                    "You must check in first before starting work on a task. " +
                    "Please mark your attendance for today.");
        }
        // ── END CHECK-IN GUARD ──────────────────────────────────────

        if (request.getTaskId() == null) {
            throw new BadRequestException(
                    "Task ID is required. Please select a task to start.");
        }

        User user = userRepository.findByIdWithProfile(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User", "id", userId));

        Task task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Task", "id", request.getTaskId()));

        // Verify this task is assigned to this user
        TaskEmployeeAssignment tea = taskEmployeeRepository
                .findByTaskIdAndUserId(task.getId(), userId)
                .orElseThrow(() -> new BadRequestException(
                        "This task is not assigned to you."));

        // Verify task is not already completed by this user
        if ("Completed".equals(tea.getStatus())) {
            throw new BadRequestException(
                    "This task is already completed by you.");
        }

        // Priority order: first incomplete task must be worked on first
        List<Task> activeTasks = taskRepository.findByAssignedUserId(userId);
        if (!activeTasks.isEmpty()) {
            Task firstTask = activeTasks.get(0);
            if (!firstTask.getId().equals(task.getId())) {
                throw new BadRequestException(
                        "You must complete your current priority task first: '"
                                + firstTask.getTaskTitle() + "'.");
            }
        }

        // Auto-derive project and process from the task (read-only for employee)
        Project project = task.getProject();
        Process process = task.getProcess();

        if (project == null) {
            throw new BadRequestException(
                    "Task has no project assigned. Contact your admin.");
        }
        if (process == null) {
            throw new BadRequestException(
                    "Task has no process assigned. Contact your admin.");
        }

        // Auto-derive first job from task (if any)
        // BUG FIX: Use repository, not lazy collection
        List<TaskJobAssignment> jobLinks =
                taskJobRepository.findByTaskId(task.getId());
        var firstJob = jobLinks.isEmpty() ? null
                : jobLinks.get(0).getJob();

        // Get shift
        Shift shift = shiftAssignmentRepository
                .findByUserIdAndEffectiveToIsNull(userId)
                .map(s -> s.getShift())
                .orElse(null);

        TimeLog timeLog = TimeLog.builder()
                .user(user)
                .project(project)
                .process(process)
                .job(firstJob)
                .task(task)
                .shift(shift)
                .startTime(OffsetDateTime.now())
                .status("Running")
                .logDate(LocalDate.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        timeLog = timeLogRepository.save(timeLog);
        ensureAttendanceEmployeeExists(user);

        // Update tea status to "In Progress"
        tea.setStatus("In Progress");
        tea.setUpdatedAt(OffsetDateTime.now());
        taskEmployeeRepository.save(tea);

        // Update task status to WIP
        task.setStatus("WIP");
        task.setUpdatedAt(OffsetDateTime.now());
        taskRepository.save(task);

        log.info("Task '{}' started for user {}",
                task.getTaskTitle(), userId);

        return buildContext(timeLog, userId);
    }


    // ─────────────────────────────────────────────
    // STOP TASK
    //
    // RULE: "Completed" only if totalPages (previous + this session) >= assigned.
    // BUG FIX: canComplete uses >= not ==.
    // BUG FIX: syncTaskStatusFromAssignments() is now actually called.
    // BUG FIX: break_logs.break_reason stores the enum value ('Other'),
    //          not the free-text custom reason — DB CHECK constraint.
    // ─────────────────────────────────────────────
    @Transactional
    public StopTaskResponse stopTask(UUID userId,
                                     StopTaskRequest request) {

        TimeLog timeLog = timeLogRepository.findById(request.getTimeLogId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "TimeLog", "id", request.getTimeLogId()));

        if (!timeLog.getUser().getId().equals(userId)) {
            throw new BadRequestException(
                    "Cannot stop another user's timer.");
        }
        if (!"Running".equals(timeLog.getStatus())
                && !"On Break".equals(timeLog.getStatus())) {
            throw new BadRequestException(
                    "This time log is not currently running.");
        }

        // Resolve assignment info for page validation
        Integer assignedPages          = null;
        Integer previousPagesCompleted = 0;
        TaskEmployeeAssignment tea     = null;

        if (timeLog.getTask() != null) {
            tea = taskEmployeeRepository
                    .findByTaskIdAndUserId(
                            timeLog.getTask().getId(), userId)
                    .orElse(null);
            if (tea != null) {
                assignedPages          = tea.getAssignedPages();
                previousPagesCompleted = tea.getPagesCompleted() != null
                        ? tea.getPagesCompleted() : 0;
            }
        }

        int pagesThisSession = request.getPagesCompleted() != null
                ? request.getPagesCompleted() : 0;

        // Cumulative pages = saved total + this session's input
        int totalPagesNow = previousPagesCompleted + pagesThisSession;

        // BUG FIX: >= not ==
        boolean canComplete = assignedPages == null
                || totalPagesNow >= assignedPages;

        String requestedStatus = request.getStatus();

        if ("completed".equalsIgnoreCase(requestedStatus) && !canComplete) {
            throw new BadRequestException(
                    "Cannot mark as Completed. You have completed "
                            + totalPagesNow + " of " + assignedPages
                            + " assigned pages. Complete all pages first.");
        }

        // Determine TimeLog.status — must match DB CHECK constraint on time_logs:
        // ('Running','On Break','FINISH','WIP','YTS','RTU',
        //  'UPLOADED','PENDING','HOLD','QUERY')
        String timeLogStatus;
        if ("completed".equalsIgnoreCase(requestedStatus) && canComplete) {
            timeLogStatus = "FINISH";
        } else if ("on-hold".equalsIgnoreCase(requestedStatus)) {
            timeLogStatus = "HOLD";
        } else {
            timeLogStatus = "WIP";
        }

        OffsetDateTime endTime = OffsetDateTime.now();
        long totalElapsed = ChronoUnit.SECONDS.between(
                timeLog.getStartTime(), endTime);

        // Close any open break
        breakLogRepository
                .findByTimeLogIdAndBreakEndIsNull(timeLog.getId())
                .ifPresent(breakLog -> {
                    breakLog.setBreakEnd(endTime);
                    int dur = (int) ChronoUnit.SECONDS.between(
                            breakLog.getBreakStart(), endTime);
                    breakLog.setDurationSeconds(dur);
                    breakLogRepository.save(breakLog);
                    timeLog.setBreakSeconds(
                            (timeLog.getBreakSeconds() != null
                                    ? timeLog.getBreakSeconds() : 0) + dur);
                });

        int totalBreak     = timeLog.getBreakSeconds() != null
                ? timeLog.getBreakSeconds() : 0;
        int workingSeconds = (int) Math.max(totalElapsed - totalBreak, 0);

        timeLog.setEndTime(endTime);
        timeLog.setElapsedSeconds((int) totalElapsed);
        timeLog.setWorkingSeconds(workingSeconds);
        timeLog.setPagesCompleted(pagesThisSession);
        timeLog.setMarkTaskCompleted("FINISH".equals(timeLogStatus));
        timeLog.setStatus(timeLogStatus);
        timeLog.setUpdatedAt(OffsetDateTime.now());
        timeLogRepository.save(timeLog);

        // Update employee assignment
        boolean taskFullyCompleted = false;
        if (timeLog.getTask() != null && tea != null) {
            final TaskEmployeeAssignment teaFinal = tea;

            teaFinal.setPagesCompleted(totalPagesNow);

            // tea.status DB constraint: ('Pending','In Progress','Completed')
            if ("FINISH".equals(timeLogStatus)) {
                teaFinal.setStatus("Completed");
            } else {
                // HOLD or WIP: keep as In Progress so they can resume
                teaFinal.setStatus("In Progress");
            }
            teaFinal.setUpdatedAt(OffsetDateTime.now());
            taskEmployeeRepository.save(teaFinal);

            // BUG FIX: NOW actually call syncTaskStatus
            Task t = taskRepository.findById(timeLog.getTask().getId())
                    .orElse(null);
            if (t != null) {
                taskFullyCompleted = syncTaskStatusFromAssignments(t);
            }
        }

        MyTaskOption nextTask = getNextTask(userId);

        log.info("Task stopped for user {} — {}s worked, {} pages this session "
                        + "({} total), status: {}",
                userId, workingSeconds, pagesThisSession,
                totalPagesNow, timeLogStatus);

        return StopTaskResponse.builder()
                .timeLog(toTimeLogResponse(timeLog))
                .taskCompleted(taskFullyCompleted)
                .nextTask(nextTask)
                .message(buildStopMessage(timeLogStatus,
                        pagesThisSession, totalPagesNow,
                        assignedPages, nextTask))
                .build();
    }

    // ─────────────────────────────────────────────
    // SYNC TASK STATUS FROM ALL EMPLOYEE ASSIGNMENTS
    //
    // RULE 4 — called after every stop:
    //   All Completed  → task.status = "FINISH"
    //   Any In Progress or mixed → task.status = "WIP"
    //   All Pending    → preserve admin-set status or "HOLD"
    //
    // Returns true if task is now FINISH.
    // ─────────────────────────────────────────────
    private boolean syncTaskStatusFromAssignments(Task task) {
        List<TaskEmployeeAssignment> all =
                taskEmployeeRepository.findByTaskId(task.getId());

        if (all.isEmpty()) return false;

        boolean allCompleted  = all.stream()
                .allMatch(a -> "Completed".equals(a.getStatus()));
        boolean anyInProgress = all.stream()
                .anyMatch(a -> "In Progress".equals(a.getStatus()));
        boolean anyCompleted  = all.stream()
                .anyMatch(a -> "Completed".equals(a.getStatus()));

        String newStatus;
        if (allCompleted) {
            newStatus = "FINISH";
        } else if (anyInProgress || anyCompleted) {
            newStatus = "WIP";
        } else {
            // All still Pending
            String existing = task.getStatus();
            if ("WIP".equals(existing) || "FINISH".equals(existing)) {
                newStatus = "HOLD";
            } else {
                newStatus = existing;
            }
        }

        task.setStatus(newStatus);
        task.setUpdatedAt(OffsetDateTime.now());
        taskRepository.save(task);

        log.info("Task {} status synced → '{}'", task.getId(), newStatus);
        return "FINISH".equals(newStatus);
    }

    // ─────────────────────────────────────────────
    // START BREAK
    // BUG FIX: breakLog.breakReason stores the DB-enum value ('Other'),
    //          NOT the free-text custom reason. The custom text goes into
    //          breakLog.customReason and breakLog.description instead.
    //          DB CHECK: ('Tea Break','Lunch Break','Restroom','Other')
    // ─────────────────────────────────────────────
    @Transactional
    public WorkwiseContextResponse startBreak(UUID userId,
                                              StartBreakRequest request) {

        TimeLog timeLog = timeLogRepository.findById(request.getTimeLogId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "TimeLog", "id", request.getTimeLogId()));

        if (!timeLog.getUser().getId().equals(userId)) {
            throw new BadRequestException(
                    "Cannot modify another user's timer.");
        }
        if (!"Running".equals(timeLog.getStatus())) {
            throw new BadRequestException(
                    "Can only take a break when the timer is running.");
        }
        if (breakLogRepository.existsByTimeLogIdAndBreakEndIsNull(
                timeLog.getId())) {
            throw new BadRequestException(
                    "Already on break. Resume first.");
        }

        OffsetDateTime now = OffsetDateTime.now();

        // BUG FIX: breakReason MUST be the DB enum value.
        // Valid: 'Tea Break' | 'Lunch Break' | 'Restroom' | 'Other'
        // Custom text → customReason column only.
        String enumReason = request.getBreakReason(); // keep as-is

        BreakLog breakLog = BreakLog.builder()
                .timeLog(timeLog)
                .user(timeLog.getUser())
                .breakReason(enumReason)           // enum column
                .customReason(request.getCustomReason())  // free text
                .description(request.getDescription())
                .breakStart(now)
                .build();

        breakLogRepository.save(breakLog);

        timeLog.setStatus("On Break");
        timeLog.setUpdatedAt(now);
        timeLogRepository.save(timeLog);

        log.info("Break started for user {} — reason: {}", userId, enumReason);

        return buildContext(timeLog, userId);
    }

    // ─────────────────────────────────────────────
    // END BREAK
    // ─────────────────────────────────────────────
    @Transactional
    public WorkwiseContextResponse endBreak(UUID userId, UUID timeLogId) {

        TimeLog timeLog = timeLogRepository.findById(timeLogId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "TimeLog", "id", timeLogId));

        if (!timeLog.getUser().getId().equals(userId)) {
            throw new BadRequestException(
                    "Cannot modify another user's timer.");
        }

        OffsetDateTime now = OffsetDateTime.now();

        breakLogRepository
                .findByTimeLogIdAndBreakEndIsNull(timeLogId)
                .ifPresent(b -> {
                    b.setBreakEnd(now);
                    int dur = (int) ChronoUnit.SECONDS.between(
                            b.getBreakStart(), now);
                    b.setDurationSeconds(dur);
                    breakLogRepository.save(b);
                    timeLog.setBreakSeconds(
                            (timeLog.getBreakSeconds() != null
                                    ? timeLog.getBreakSeconds() : 0) + dur);
                });

        timeLog.setStatus("Running");
        timeLog.setUpdatedAt(now);
        timeLogRepository.save(timeLog);

        return buildContext(timeLog, userId);
    }

    // ─────────────────────────────────────────────
    // GET MY TIME LOGS — scoped to this user only
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<TimeLogResponse> getMyTimeLogs(UUID userId,
                                               UUID projectId,
                                               UUID processId,
                                               String status,
                                               LocalDate startDate,
                                               LocalDate endDate,
                                               int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return timeLogRepository.searchTimeLogs(
                userId, projectId, processId,
                status, startDate, endDate, pageable
        ).map(this::toTimeLogResponse);
    }

    // ─────────────────────────────────────────────
    // GET ALL EMPLOYEES TIME LOGS — for Admin/Manager
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<TimeLogResponse> getAdminTimeLogs(UUID userId,
                                                  UUID projectId,
                                                  UUID processId,
                                                  String status,
                                                  LocalDate startDate,
                                                  LocalDate endDate) {
        return timeLogRepository.searchAdminTimeLogs(
                userId, projectId, processId, status, startDate, endDate
        ).stream().map(this::toTimeLogResponse).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // VALIDATE STOP
    // BUG FIX: canComplete = already saved pages >= assignedPages.
    //          Frontend adds this session's input on top for live feedback.
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public StopValidationResponse validateStop(UUID userId, UUID timeLogId) {
        TimeLog timeLog = timeLogRepository.findById(timeLogId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "TimeLog", "id", timeLogId));

        if (timeLog.getTask() == null) {
            return StopValidationResponse.builder()
                    .canComplete(true)
                    .assignedPages(null)
                    .pagesCompletedSoFar(0)
                    .taskTitle(null)
                    .build();
        }

        TaskEmployeeAssignment tea = taskEmployeeRepository
                .findByTaskIdAndUserId(timeLog.getTask().getId(), userId)
                .orElse(null);

        Integer assignedPages    = tea != null ? tea.getAssignedPages() : null;
        Integer alreadyCompleted = tea != null
                && tea.getPagesCompleted() != null
                ? tea.getPagesCompleted() : 0;

        // BUG FIX: >= not ==
        boolean canComplete = assignedPages == null
                || alreadyCompleted >= assignedPages;

        return StopValidationResponse.builder()
                .canComplete(canComplete)
                .assignedPages(assignedPages)
                .pagesCompletedSoFar(alreadyCompleted)
                .taskTitle(timeLog.getTask().getTaskTitle())
                .assignedPagesStr(timeLog.getTask().getAssignedPagesStr())
                .build();
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────

    private WorkwiseContextResponse buildContext(TimeLog log, UUID userId) {
        OffsetDateTime now = OffsetDateTime.now();
        int elapsed = (int) ChronoUnit.SECONDS.between(
                log.getStartTime(), now);

        int breakSeconds = log.getBreakSeconds() != null
                ? log.getBreakSeconds() : 0;

        BreakLog activeBreak = breakLogRepository
                .findByTimeLogIdAndBreakEndIsNull(log.getId())
                .orElse(null);

        if (activeBreak != null) {
            int curBreak = (int) ChronoUnit.SECONDS.between(
                    activeBreak.getBreakStart(), now);
            breakSeconds += curBreak;
        }

        int workingSeconds = Math.max(elapsed - breakSeconds, 0);

        String  isbnTitle           = null;
        String  dueDate             = null;
        String  pages               = null;
        String  chapter             = null;
        String  complexity          = null;
        Integer totalPages          = null;
        Integer assignedPages       = null;
        Integer pagesCompletedSoFar = 0;

        if (log.getJob() != null) {
            isbnTitle  = log.getJob().getXmlIsbn() != null
                    ? log.getJob().getXmlIsbn()
                    : log.getJob().getJobIdCode();
            totalPages = log.getJob().getPageCount();
        }

        if (log.getTask() != null) {
            Task task = log.getTask();
            dueDate   = task.getDueDate() != null
                    ? task.getDueDate().toString() : null;
            pages     = task.getAssignedPagesStr() != null
                    ? task.getAssignedPagesStr()
                    : (task.getAssignedPages() != null
                        ? task.getAssignedPages().toString() : null);
            chapter   = task.getChapterArticleBatch();
            complexity = task.getComplexity();

            TaskEmployeeAssignment tea = taskEmployeeRepository
                    .findByTaskIdAndUserId(task.getId(), userId)
                    .orElse(null);
            if (tea != null) {
                assignedPages       = tea.getAssignedPages();
                pagesCompletedSoFar = tea.getPagesCompleted() != null
                        ? tea.getPagesCompleted() : 0;
            }

            if (totalPages == null && task.getTotalPages() != null) {
                totalPages = task.getTotalPages();
            }
        }

        String shiftName = log.getShift() != null
                ? log.getShift().getName() : null;

        // Display break reason — if 'Other', show customReason instead
        String displayBreakReason = null;
        if (activeBreak != null) {
            displayBreakReason = "Other".equals(activeBreak.getBreakReason())
                    && activeBreak.getCustomReason() != null
                    && !activeBreak.getCustomReason().isBlank()
                    ? activeBreak.getCustomReason()
                    : activeBreak.getBreakReason();
        }

        return WorkwiseContextResponse.builder()
                .timeLogId(log.getId())
                .status(log.getStatus())
                .startedAt(log.getStartTime())
                .elapsedSeconds(elapsed)
                .breakSeconds(breakSeconds)
                .workingSeconds(workingSeconds)
                .projectName(log.getProject() != null
                        ? log.getProject().getName() : null)
                .processName(log.getProcess() != null
                        ? log.getProcess().getName() : null)
                .isbnBookTitle(isbnTitle)
                .dueDate(dueDate)
                .assignedPagesAndChapter(buildPagesChapter(pages, chapter))
                .shift(shiftName)
                .complexity(complexity)
                .totalPages(totalPages)
                .assignedPages(assignedPages)
                .pagesCompletedSoFar(pagesCompletedSoFar)
                .taskDescription(log.getTask() != null
                        ? log.getTask().getDescription() : null)
                .activeBreakLogId(activeBreak != null
                        ? activeBreak.getId() : null)
                .breakReason(displayBreakReason)
                .breakStartedAt(activeBreak != null
                        ? activeBreak.getBreakStart() : null)
                .build();
    }

    private String buildPagesChapter(String pages, String chapter) {
        if (pages == null && chapter == null) return null;
        StringBuilder sb = new StringBuilder();
        if (pages != null) sb.append(pages).append(" pages");
        if (chapter != null) {
            if (sb.length() > 0) sb.append(" / ");
            sb.append(chapter);
        }
        return sb.toString();
    }

    private String buildStopMessage(String status,
                                    int pagesThisSession,
                                    int totalPages,
                                    Integer assignedPages,
                                    MyTaskOption nextTask) {
        StringBuilder msg = new StringBuilder();
        msg.append("Task ").append(status.toLowerCase()).append(". ");
        msg.append("Pages this session: ").append(pagesThisSession);
        if (assignedPages != null) {
            msg.append(" | Total: ").append(totalPages)
                    .append(" / ").append(assignedPages);
        }
        msg.append(". ");
        msg.append(nextTask != null
                ? "Next: " + nextTask.getTaskTitle()
                : "No more tasks assigned.");
        return msg.toString();
    }

    @Transactional(readOnly = true)
    public CalendarStatsResponse getCalendarStats(UUID userId, int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        List<TimeLog> logs = timeLogRepository.findByUserIdAndLogDateBetween(userId, startDate, endDate);

        // Group by logDate to build dailyStats
        java.util.Map<LocalDate, List<TimeLog>> dailyMap = logs.stream()
                .collect(Collectors.groupingBy(TimeLog::getLogDate));

        List<CalendarStatsResponse.DailyStat> dailyStats = new java.util.ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            List<TimeLog> dayLogs = dailyMap.getOrDefault(date, List.of());
            long workingSeconds = dayLogs.stream().mapToLong(l -> l.getWorkingSeconds() != null ? l.getWorkingSeconds() : 0).sum();
            int pages = dayLogs.stream().mapToInt(l -> l.getPagesCompleted() != null ? l.getPagesCompleted() : 0).sum();
            java.util.Set<String> projectNames = dayLogs.stream()
                    .filter(l -> l.getProject() != null)
                    .map(l -> l.getProject().getName())
                    .collect(Collectors.toSet());

            dailyStats.add(CalendarStatsResponse.DailyStat.builder()
                    .date(date)
                    .workingSeconds(workingSeconds)
                    .pagesCompleted(pages)
                    .projectNames(projectNames)
                    .build());
        }

        // Group by week (Monday to Sunday)
        List<CalendarStatsResponse.WeeklyStat> weeklyStats = new java.util.ArrayList<>();
        LocalDate current = startDate;
        int weekIndex = 1;
        while (!current.isAfter(endDate)) {
            LocalDate weekStart = current;
            LocalDate weekEnd = current;
            while (weekEnd.getDayOfWeek() != java.time.DayOfWeek.SUNDAY && weekEnd.isBefore(endDate)) {
                weekEnd = weekEnd.plusDays(1);
            }

            final LocalDate finalStart = weekStart;
            final LocalDate finalEnd = weekEnd;

            List<TimeLog> weekLogs = logs.stream()
                    .filter(l -> !l.getLogDate().isBefore(finalStart) && !l.getLogDate().isAfter(finalEnd))
                    .collect(Collectors.toList());

            long workingSeconds = weekLogs.stream().mapToLong(l -> l.getWorkingSeconds() != null ? l.getWorkingSeconds() : 0).sum();
            int pages = weekLogs.stream().mapToInt(l -> l.getPagesCompleted() != null ? l.getPagesCompleted() : 0).sum();
            int projects = (int) weekLogs.stream()
                    .filter(l -> l.getProject() != null)
                    .map(l -> l.getProject().getId())
                    .distinct()
                    .count();

            weeklyStats.add(CalendarStatsResponse.WeeklyStat.builder()
                    .weekLabel("Week " + weekIndex)
                    .startDate(weekStart)
                    .endDate(weekEnd)
                    .workingSeconds(workingSeconds)
                    .pagesCompleted(pages)
                    .projectCount(projects)
                    .build());

            weekIndex++;
            current = weekEnd.plusDays(1);
        }

        // Group by project
        java.util.Map<String, List<TimeLog>> projectMap = logs.stream()
                .filter(l -> l.getProject() != null)
                .collect(Collectors.groupingBy(l -> l.getProject().getName()));

        List<CalendarStatsResponse.ProjectStat> projectBreakdown = new java.util.ArrayList<>();
        for (java.util.Map.Entry<String, List<TimeLog>> entry : projectMap.entrySet()) {
            long workingSeconds = entry.getValue().stream().mapToLong(l -> l.getWorkingSeconds() != null ? l.getWorkingSeconds() : 0).sum();
            int pages = entry.getValue().stream().mapToInt(l -> l.getPagesCompleted() != null ? l.getPagesCompleted() : 0).sum();

            projectBreakdown.add(CalendarStatsResponse.ProjectStat.builder()
                    .projectName(entry.getKey())
                    .workingSeconds(workingSeconds)
                    .pagesCompleted(pages)
                    .build());
        }

        // Monthly Summary
        long totalWorking = logs.stream().mapToLong(l -> l.getWorkingSeconds() != null ? l.getWorkingSeconds() : 0).sum();
        int totalPages = logs.stream().mapToInt(l -> l.getPagesCompleted() != null ? l.getPagesCompleted() : 0).sum();
        int totalProjects = (int) logs.stream()
                .filter(l -> l.getProject() != null)
                .map(l -> l.getProject().getId())
                .distinct()
                .count();

        CalendarStatsResponse.SummaryStat monthlySummary = CalendarStatsResponse.SummaryStat.builder()
                .totalWorkingSeconds(totalWorking)
                .totalPagesCompleted(totalPages)
                .uniqueProjectsCount(totalProjects)
                .build();

        return CalendarStatsResponse.builder()
                .dailyStats(dailyStats)
                .weeklyStats(weeklyStats)
                .projectBreakdown(projectBreakdown)
                .monthlySummary(monthlySummary)
                .build();
    }

    private void ensureAttendanceEmployeeExists(User user) {
        try {
            AttendanceEmployee emp = attendanceEmployeeRepository.findByUserId(user.getId())
                    .orElseGet(() -> {
                        String fullName = user.getEmployeeProfile() != null
                                ? user.getEmployeeProfile().getFullName()
                                : null;
                        if (fullName != null) {
                            List<AttendanceEmployee> employees =
                                    attendanceEmployeeRepository.searchEmployees(null, fullName.trim());
                            if (!employees.isEmpty()) {
                                AttendanceEmployee existing = employees.get(0);
                                existing.setUserId(user.getId());
                                existing.setUpdatedAt(OffsetDateTime.now());
                                return attendanceEmployeeRepository.save(existing);
                            }
                        }
                        return null;
                    });

            if (emp == null) {
                String fullName = user.getEmployeeProfile() != null
                        ? user.getEmployeeProfile().getFullName()
                        : user.getEmail();
                
                int sortOrder = (int) attendanceEmployeeRepository.count() + 1;
                emp = AttendanceEmployee.builder()
                        .userId(user.getId())
                        .name(fullName.trim())
                        .category("Employee")
                        .isActive(true)
                        .sortOrder(sortOrder)
                        .baseSalary(new java.math.BigDecimal("5000.00"))
                        .updatedAt(OffsetDateTime.now())
                        .build();
                attendanceEmployeeRepository.save(emp);
                log.info("Auto-created AttendanceEmployee '{}' for user during Workwise task start", emp.getName());
            }
        } catch (Exception e) {
            log.warn("Could not ensure attendance employee exists: {}", e.getMessage());
        }
    }

    private TimeLogResponse toTimeLogResponse(TimeLog log) {
        String fullName = log.getUser().getEmployeeProfile() != null
                ? log.getUser().getEmployeeProfile().getFullName()
                : log.getUser().getEmail();
        String shiftName = log.getShift() != null
                ? log.getShift().getName() : null;
        String isbnTitle = log.getJob() != null
                ? (log.getJob().getXmlIsbn() != null
                ? log.getJob().getXmlIsbn()
                : log.getJob().getJobIdCode())
                : null;

        List<TimeLogResponse.BreakLogDto> breakLogs = log.getBreakLogs() == null
                ? List.of()
                : log.getBreakLogs().stream()
                        .map(b -> TimeLogResponse.BreakLogDto.builder()
                                .id(b.getId())
                                .breakReason(b.getBreakReason())
                                .customReason(b.getCustomReason())
                                .description(b.getDescription())
                                .breakStart(b.getBreakStart())
                                .breakEnd(b.getBreakEnd())
                                .durationSeconds(b.getDurationSeconds())
                                .build())
                        .sorted(java.util.Comparator.comparing(TimeLogResponse.BreakLogDto::getBreakStart))
                        .collect(Collectors.toList());

        OffsetDateTime[] manualTimes = new OffsetDateTime[2];
        try {
            attendanceEmployeeRepository.findByUserId(log.getUser().getId()).ifPresent(emp -> {
                attendanceRecordRepository.findByEmployeeIdAndAttendanceDate(emp.getId(), log.getLogDate()).ifPresent(rec -> {
                    manualTimes[0] = rec.getCheckInTime();
                    manualTimes[1] = rec.getCheckOutTime();
                });
            });
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(WorkwiseService.class).warn("Could not fetch manual check-in/out: {}", e.getMessage());
        }

        String taskTitle = log.getTask() != null ? log.getTask().getTaskTitle() : null;

        return TimeLogResponse.builder()
                .id(log.getId())
                .userId(log.getUser().getId())
                .employeeName(fullName)
                .projectId(log.getProject() != null ? log.getProject().getId() : null)
                .projectName(log.getProject() != null
                        ? log.getProject().getName() : null)
                .processId(log.getProcess() != null ? log.getProcess().getId() : null)
                .processName(log.getProcess() != null
                        ? log.getProcess().getName() : null)
                .isbnTitle(isbnTitle)
                .taskTitle(taskTitle)
                .startTime(log.getStartTime())
                .endTime(log.getEndTime())
                .elapsedSeconds(log.getElapsedSeconds())
                .workingSeconds(log.getWorkingSeconds())
                .breakSeconds(log.getBreakSeconds())
                .pagesCompleted(log.getPagesCompleted())
                .status(log.getStatus())
                .logDate(log.getLogDate())
                .shift(shiftName)
                .breakLogs(breakLogs)
                .manualCheckIn(manualTimes[0])
                .manualCheckOut(manualTimes[1])
                .build();
    }
}