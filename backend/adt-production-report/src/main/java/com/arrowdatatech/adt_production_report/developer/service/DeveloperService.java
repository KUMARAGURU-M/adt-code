package com.arrowdatatech.adt_production_report.developer.service;

import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.common.exception.UnauthorizedException;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.project.dto.DevProjectDtos.*;
import com.arrowdatatech.adt_production_report.project.entity.DevProject;
import com.arrowdatatech.adt_production_report.project.entity.DevProjectUpdate;
import com.arrowdatatech.adt_production_report.project.entity.DevProjectDocument;
import com.arrowdatatech.adt_production_report.project.repository.DevProjectRepository;
import com.arrowdatatech.adt_production_report.project.repository.DevProjectUpdateRepository;
import com.arrowdatatech.adt_production_report.project.repository.DevProjectDocumentRepository;
import com.arrowdatatech.adt_production_report.task.dto.DevTaskDtos.*;
import com.arrowdatatech.adt_production_report.task.entity.DevTask;
import com.arrowdatatech.adt_production_report.task.repository.DevTaskRepository;
import com.arrowdatatech.adt_production_report.correction.dto.DevCorrectionDtos.*;
import com.arrowdatatech.adt_production_report.correction.entity.DevCorrection;
import com.arrowdatatech.adt_production_report.correction.repository.DevCorrectionRepository;
import com.arrowdatatech.adt_production_report.overtime.dto.DevOvertimeDtos.*;
import com.arrowdatatech.adt_production_report.overtime.entity.DevOvertime;
import com.arrowdatatech.adt_production_report.overtime.repository.DevOvertimeRepository;
import com.arrowdatatech.adt_production_report.meeting.dto.DevMeetingDtos.*;
import com.arrowdatatech.adt_production_report.meeting.entity.DevMeeting;
import com.arrowdatatech.adt_production_report.meeting.entity.DevMeetingActionItem;
import com.arrowdatatech.adt_production_report.meeting.repository.DevMeetingRepository;
import com.arrowdatatech.adt_production_report.meeting.repository.DevMeetingActionItemRepository;
import com.arrowdatatech.adt_production_report.techdocs.dto.DevTechDocDtos.*;
import com.arrowdatatech.adt_production_report.techdocs.entity.DevTechDoc;
import com.arrowdatatech.adt_production_report.techdocs.repository.DevTechDocRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeveloperService {

    private final DevProjectRepository projectRepository;
    private final DevTaskRepository taskRepository;
    private final DevCorrectionRepository correctionRepository;
    private final DevOvertimeRepository overtimeRepository;
    private final DevMeetingRepository meetingRepository;
    private final DevMeetingActionItemRepository meetingActionItemRepository;
    private final DevTechDocRepository techDocRepository;
    private final UserRepository userRepository;
    private final DevProjectUpdateRepository updateRepository;
    private final DevProjectDocumentRepository documentRepository;

    // ─────────────────────────────────────────────
    // PROJECTS
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<DevProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::toProjectResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DevProjectResponse createProject(DevProjectRequest request) {
        DevProject project = DevProject.builder()
                .name(request.getName())
                .description(request.getDescription())
                .technologies(request.getTechnologies())
                .repositoryUrl(request.getRepositoryUrl())
                .status(request.getStatus() != null ? request.getStatus() : "Active")
                .build();
        return toProjectResponse(projectRepository.save(project));
    }

    @Transactional
    public DevProjectResponse updateProject(UUID id, DevProjectRequest request) {
        DevProject project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DevProject", "id", id));
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setTechnologies(request.getTechnologies());
        project.setRepositoryUrl(request.getRepositoryUrl());
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        return toProjectResponse(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(UUID id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("DevProject", "id", id);
        }

        // Delete updates
        List<DevProjectUpdate> updatesList = updateRepository.findByProjectIdOrderByDateDescCreatedAtDesc(id);
        updateRepository.deleteAll(updatesList);

        // Delete documents
        List<DevProjectDocument> documentsList = documentRepository.findByProjectId(id);
        documentRepository.deleteAll(documentsList);

        // 1. Unlink from meetings
        List<DevMeeting> meetings = meetingRepository.findAll().stream()
                .filter(m -> m.getProject() != null && m.getProject().getId().equals(id))
                .collect(Collectors.toList());
        for (DevMeeting meeting : meetings) {
            meeting.setProject(null);
            meetingRepository.save(meeting);
        }

        // 2. Delete tasks and their corrections
        List<DevTask> tasks = taskRepository.findAll().stream()
                .filter(t -> t.getProject().getId().equals(id))
                .collect(Collectors.toList());
        for (DevTask task : tasks) {
            List<DevCorrection> corrections = correctionRepository.findAll().stream()
                    .filter(c -> c.getTask().getId().equals(task.getId()))
                    .collect(Collectors.toList());
            correctionRepository.deleteAll(corrections);
            taskRepository.delete(task);
        }

        // 3. Finally delete the project
        projectRepository.deleteById(id);
    }

    private DevProjectResponse toProjectResponse(DevProject p) {
        List<DevProjectUpdateResponse> updates = updateRepository.findByProjectIdOrderByDateDescCreatedAtDesc(p.getId()).stream()
                .map(u -> DevProjectUpdateResponse.builder()
                        .id(u.getId())
                        .author(u.getAuthor())
                        .text(u.getUpdateText())
                        .date(u.getDate().toString())
                        .build())
                .collect(Collectors.toList());

        List<DevProjectDocumentResponse> documents = documentRepository.findByProjectId(p.getId()).stream()
                .map(d -> DevProjectDocumentResponse.builder()
                        .id(d.getId())
                        .name(d.getName())
                        .type(d.getType())
                        .size(d.getSize())
                        .fileUrl(d.getFileUrl())
                        .mediaFileId(d.getMediaFileId())
                        .build())
                .collect(Collectors.toList());

        return DevProjectResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .technologies(p.getTechnologies())
                .repositoryUrl(p.getRepositoryUrl())
                .status(p.getStatus())
                .updates(updates)
                .documents(documents)
                .build();
    }

    // ─────────────────────────────────────────────
    // TASKS
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<DevTaskResponse> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(this::toTaskResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DevTaskResponse> getTasksForUser(UUID userId) {
        return taskRepository.findByAssignedToId(userId).stream()
                .map(this::toTaskResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DevTaskResponse createTask(DevTaskRequest request) {
        DevProject project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("DevProject", "id", request.getProjectId()));
        
        User assignedTo = resolveUserByName(request.getAssignedToName());
        User assignedBy = null;
        if (request.getAssignedByName() != null && !request.getAssignedByName().trim().isEmpty()) {
            assignedBy = resolveUserByName(request.getAssignedByName());
        }
        if (assignedBy == null) {
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            assignedBy = userRepository.findById(currentUserId).orElse(null);
        }

        DevTask task = DevTask.builder()
                .project(project)
                .title(request.getTitle())
                .description(request.getDescription())
                .assignedTo(assignedTo)
                .assignedBy(assignedBy)
                .assignedDate(request.getAssignedDate() != null ? request.getAssignedDate() : LocalDate.now())
                .dueDate(request.getDueDate())
                .priority(request.getPriority() != null ? request.getPriority() : "Medium")
                .status(request.getStatus() != null ? request.getStatus() : "Pending")
                .build();
        return toTaskResponse(taskRepository.save(task));
    }

    @Transactional
    public DevTaskResponse updateTask(UUID id, DevTaskRequest request) {
        DevTask task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DevTask", "id", id));
        
        if (request.getProjectId() != null) {
            DevProject project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("DevProject", "id", request.getProjectId()));
            task.setProject(project);
        }
        
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        
        if (request.getAssignedToName() != null) {
            task.setAssignedTo(resolveUserByName(request.getAssignedToName()));
        }
        
        if (request.getAssignedByName() != null) {
            task.setAssignedBy(resolveUserByName(request.getAssignedByName()));
        }
        
        if (request.getAssignedDate() != null) {
            task.setAssignedDate(request.getAssignedDate());
        }
        
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
            if ("Completed".equalsIgnoreCase(request.getStatus())) {
                task.setCompletedDate(LocalDate.now());
            } else {
                task.setCompletedDate(null);
            }
        }
        
        return toTaskResponse(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(UUID id) {
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("DevTask", "id", id);
        }
        taskRepository.deleteById(id);
    }

    private DevTaskResponse toTaskResponse(DevTask t) {
        String assignedToRole = "";
        User assigned = t.getAssignedTo();
        if (assigned != null) {
            assignedToRole = "Employee"; // fallback
            if (assigned.getRoleAssignments() != null && !assigned.getRoleAssignments().isEmpty()) {
                assignedToRole = assigned.getRoleAssignments().iterator().next().getRole().getName();
            }
        }

        return DevTaskResponse.builder()
                .id(t.getId())
                .projectId(t.getProject().getId())
                .project(t.getProject().getName())
                .title(t.getTitle())
                .description(t.getDescription())
                .assignedTo(t.getAssignedTo() != null ? getDisplayName(t.getAssignedTo()) : "Unassigned")
                .assignedToRole(assignedToRole)
                .assignedBy(t.getAssignedBy() != null ? getDisplayName(t.getAssignedBy()) : "System")
                .assignedDate(t.getAssignedDate())
                .dueDate(t.getDueDate())
                .completedDate(t.getCompletedDate())
                .priority(t.getPriority())
                .status(t.getStatus())
                .completed("Completed".equalsIgnoreCase(t.getStatus()))
                .correction(t.getCorrection())
                .feedback(t.getFeedback())
                .build();
    }

    // ─────────────────────────────────────────────
    // CORRECTIONS
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<DevCorrectionResponse> getAllCorrections() {
        return correctionRepository.findAll().stream()
                .map(this::toCorrectionResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DevCorrectionResponse> getCorrectionsForUser(UUID userId) {
        return correctionRepository.findByAssignedToId(userId).stream()
                .map(this::toCorrectionResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DevCorrectionResponse createCorrection(DevCorrectionRequest request) {
        DevTask task = null;
        DevProject project = null;

        if (request.getTaskId() != null) {
            task = taskRepository.findById(request.getTaskId()).orElse(null);
            if (task != null) {
                project = task.getProject();
            }
        }

        if (project == null && request.getProjectId() != null) {
            project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("DevProject", "id", request.getProjectId()));
        }

        User assignedTo = resolveUserByName(request.getAssignedToName());
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User assignedBy = userRepository.findById(currentUserId).orElse(null);

        // Auto-create a corresponding task with status 'Correction'
        DevTask correctionTask = DevTask.builder()
                .project(project)
                .title("Correction: " + request.getCorrection())
                .description("Please review and fix this correction: " + (request.getLeadComment() != null ? request.getLeadComment() : ""))
                .assignedTo(assignedTo)
                .assignedBy(assignedBy)
                .assignedDate(request.getAssignedDate() != null ? request.getAssignedDate() : LocalDate.now())
                .dueDate(request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusDays(1))
                .priority(request.getPriority() != null ? request.getPriority() : "Medium")
                .status("Correction")
                .correction(request.getCorrection())
                .feedback(request.getLeadComment())
                .build();

        DevTask savedTask = taskRepository.save(correctionTask);

        // If task was not originally provided, link the newly created correctionTask
        if (task == null) {
            task = savedTask;
        }

        DevCorrection corr = DevCorrection.builder()
                .task(task)
                .project(project)
                .correction(request.getCorrection())
                .leadComment(request.getLeadComment())
                .assignedTo(assignedTo)
                .assignedBy(assignedBy)
                .assignedDate(request.getAssignedDate() != null ? request.getAssignedDate() : LocalDate.now())
                .dueDate(request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusDays(1))
                .priority(request.getPriority() != null ? request.getPriority() : "Medium")
                .status(request.getStatus() != null ? request.getStatus() : "Pending Fix")
                .build();

        DevCorrection saved = correctionRepository.save(corr);
        return toCorrectionResponse(saved);
    }

    @Transactional
    public DevCorrectionResponse updateCorrection(UUID id, DevCorrectionRequest request) {
        DevCorrection corr = correctionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DevCorrection", "id", id));
        
        corr.setCorrection(request.getCorrection());
        corr.setLeadComment(request.getLeadComment());
        corr.setDeveloperReply(request.getDeveloperReply());
        if (request.getStatus() != null) {
            corr.setStatus(request.getStatus());
        }

        if (request.getAssignedToName() != null) {
            corr.setAssignedTo(resolveUserByName(request.getAssignedToName()));
        }
        if (request.getAssignedBy() != null) {
            corr.setAssignedBy(resolveUserByName(request.getAssignedBy()));
        }
        if (request.getDueDate() != null) {
            corr.setDueDate(request.getDueDate());
        }
        if (request.getPriority() != null) {
            corr.setPriority(request.getPriority());
        }

        if (request.getTaskId() != null) {
            DevTask newTask = taskRepository.findById(request.getTaskId()).orElse(null);
            if (newTask != null) {
                corr.setTask(newTask);
                corr.setProject(newTask.getProject());
            }
        } else if (request.getProjectId() != null) {
            DevProject newProj = projectRepository.findById(request.getProjectId()).orElse(null);
            corr.setProject(newProj);
            corr.setTask(null);
        }

        DevCorrection saved = correctionRepository.save(corr);

        // Sync changes to the linked task if it's an auto-created Correction task
        DevTask linkedTask = saved.getTask();
        if (linkedTask != null && "Correction".equals(linkedTask.getStatus())) {
            linkedTask.setTitle("Correction: " + saved.getCorrection());
            linkedTask.setDescription("Please review and fix this correction: " + (saved.getLeadComment() != null ? saved.getLeadComment() : ""));
            linkedTask.setAssignedTo(saved.getAssignedTo());
            linkedTask.setAssignedBy(saved.getAssignedBy());
            linkedTask.setDueDate(saved.getDueDate());
            linkedTask.setPriority(saved.getPriority());
            linkedTask.setCorrection(saved.getCorrection());
            linkedTask.setFeedback(saved.getLeadComment());
            taskRepository.save(linkedTask);
        }

        return toCorrectionResponse(saved);
    }

    @Transactional
    public DevCorrectionResponse resolveCorrection(UUID id) {
        DevCorrection corr = correctionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DevCorrection", "id", id));
        corr.setStatus("Resolved");
        
        // Auto-update task status
        DevTask task = corr.getTask();
        if (task != null) {
            task.setStatus("Completed");
            task.setCompletedDate(LocalDate.now());
            taskRepository.save(task);
        }
        
        return toCorrectionResponse(correctionRepository.save(corr));
    }

    private DevCorrectionResponse toCorrectionResponse(DevCorrection c) {
        UUID taskId = c.getTask() != null ? c.getTask().getId() : null;
        String taskTitle = c.getTask() != null ? c.getTask().getTitle() : "";
        UUID projectId = c.getProject() != null ? c.getProject().getId() : (c.getTask() != null && c.getTask().getProject() != null ? c.getTask().getProject().getId() : null);
        String projectName = c.getProject() != null ? c.getProject().getName() : (c.getTask() != null && c.getTask().getProject() != null ? c.getTask().getProject().getName() : "");

        return DevCorrectionResponse.builder()
                .id(c.getId())
                .taskId(taskId)
                .task(taskTitle)
                .projectId(projectId)
                .project(projectName)
                .correction(c.getCorrection())
                .leadComment(c.getLeadComment())
                .assignedTo(c.getAssignedTo() != null ? getDisplayName(c.getAssignedTo()) : "Unassigned")
                .assignedBy(c.getAssignedBy() != null ? getDisplayName(c.getAssignedBy()) : "System")
                .assignedDate(c.getAssignedDate())
                .dueDate(c.getDueDate())
                .priority(c.getPriority())
                .reply(c.getDeveloperReply())
                .status(c.getStatus())
                .build();
    }

    // ─────────────────────────────────────────────
    // OVERTIME
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<DevOvertimeResponse> getAllOvertime() {
        return overtimeRepository.findAll().stream()
                .map(this::toOvertimeResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DevOvertimeResponse> getOvertimeForUser(UUID userId) {
        return overtimeRepository.findByUserId(userId).stream()
                .map(this::toOvertimeResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DevOvertimeResponse createOvertime(DevOvertimeRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new BadRequestException("Unauthorized access user profile."));

        DevOvertime ot = DevOvertime.builder()
                .user(user)
                .overtimeDate(request.getOvertimeDate() != null ? request.getOvertimeDate() : LocalDate.now())
                .overtimeHours(request.getOvertimeHours())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status("Pending")
                .build();
        return toOvertimeResponse(overtimeRepository.save(ot));
    }

    @Transactional
    public DevOvertimeResponse approveOvertime(UUID id, UUID approvedByUserId, boolean approve) {
        DevOvertime ot = overtimeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DevOvertime", "id", id));
        
        User approver = userRepository.findById(approvedByUserId).orElse(null);
        ot.setApprovedBy(approver);
        ot.setStatus(approve ? "Approved" : "Rejected");
        return toOvertimeResponse(overtimeRepository.save(ot));
    }

    private DevOvertimeResponse toOvertimeResponse(DevOvertime ot) {
        return DevOvertimeResponse.builder()
                .id(ot.getId())
                .userId(ot.getUser().getId())
                .developerName(getDisplayName(ot.getUser()))
                .overtimeDate(ot.getOvertimeDate())
                .overtimeHours(ot.getOvertimeHours())
                .description(ot.getDescription())
                .startTime(ot.getStartTime())
                .endTime(ot.getEndTime())
                .status(ot.getStatus())
                .approvedBy(ot.getApprovedBy() != null ? getDisplayName(ot.getApprovedBy()) : null)
                .createdAt(ot.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public DevOvertimeResponse getTodayOvertime(UUID userId) {
        List<DevOvertime> otList = overtimeRepository.findByUserId(userId);
        LocalDate today = LocalDate.now();
        // Find active (not checked out) record for today first
        Optional<DevOvertime> activeOt = otList.stream()
                .filter(ot -> ot.getOvertimeDate().equals(today) && ot.getEndTime() == null)
                .findFirst();
        if (activeOt.isPresent()) {
            return toOvertimeResponse(activeOt.get());
        }
        // Otherwise, find the most recent completed record for today
        Optional<DevOvertime> completedOt = otList.stream()
                .filter(ot -> ot.getOvertimeDate().equals(today))
                .max(Comparator.comparing(DevOvertime::getCreatedAt));
        return completedOt.map(this::toOvertimeResponse).orElse(null);
    }

    @Transactional
    public DevOvertimeResponse checkInOvertime() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new BadRequestException("Unauthorized access user profile."));

        LocalDate today = LocalDate.now();
        List<DevOvertime> otList = overtimeRepository.findByUserId(currentUserId);
        boolean hasActive = otList.stream()
                .anyMatch(ot -> ot.getOvertimeDate().equals(today) && ot.getEndTime() == null);
        if (hasActive) {
            throw new BadRequestException("You have already started overtime today.");
        }

        java.time.LocalTime now = java.time.LocalTime.now();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("hh:mm a", Locale.US);
        String startTimeStr = now.format(formatter).toLowerCase();

        DevOvertime ot = DevOvertime.builder()
                .user(user)
                .overtimeDate(today)
                .overtimeHours(java.math.BigDecimal.ZERO)
                .startTime(startTimeStr)
                .endTime(null)
                .description("Overtime shift started")
                .status("Pending")
                .build();
        return toOvertimeResponse(overtimeRepository.save(ot));
    }

    @Transactional
    public DevOvertimeResponse checkOutOvertime() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        LocalDate today = LocalDate.now();
        List<DevOvertime> otList = overtimeRepository.findByUserId(currentUserId);
        DevOvertime ot = otList.stream()
                .filter(o -> o.getOvertimeDate().equals(today) && o.getEndTime() == null)
                .findFirst()
                .orElseThrow(() -> new BadRequestException("No active overtime session found today."));

        java.time.LocalTime nowTime = java.time.LocalTime.now();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("hh:mm a", Locale.US);
        String endTimeStr = nowTime.format(formatter).toLowerCase();

        java.time.OffsetDateTime start = ot.getCreatedAt();
        java.time.OffsetDateTime now = java.time.OffsetDateTime.now();
        long diffSecs = Math.max(0, java.time.temporal.ChronoUnit.SECONDS.between(start, now));
        java.math.BigDecimal hours = java.math.BigDecimal.valueOf(diffSecs)
                .divide(java.math.BigDecimal.valueOf(3600), 2, java.math.RoundingMode.HALF_UP);

        ot.setEndTime(endTimeStr);
        ot.setOvertimeHours(hours);
        ot.setDescription("Overtime completed: " + hours + " hours");
        return toOvertimeResponse(overtimeRepository.save(ot));
    }

    // ─────────────────────────────────────────────
    // MEETINGS
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<DevMeetingResponse> getAllMeetings() {
        return meetingRepository.findAll().stream()
                .map(this::toMeetingResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DevMeetingResponse createMeeting(DevMeetingRequest request) {
        DevProject project = null;
        if (request.getProject() != null && !request.getProject().isBlank()) {
            project = projectRepository.findAll().stream()
                    .filter(p -> p.getName().equalsIgnoreCase(request.getProject()))
                    .findFirst()
                    .orElse(null);
        }

        Set<User> attendeesSet = new HashSet<>();
        if (request.getAttendees() != null) {
            for (String attendeeName : request.getAttendees()) {
                attendeesSet.add(resolveUserByName(attendeeName));
            }
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId).orElse(null);

        DevMeeting meeting = DevMeeting.builder()
                .title(request.getTitle())
                .project(project)
                .meetingDate(request.getDate() != null ? request.getDate() : LocalDate.now())
                .timeBlock(request.getTime())
                .location(request.getLocation())
                .agenda(request.getAgenda())
                .discussion(request.getDiscussion())
                .decisions(request.getDecisions())
                .attendees(attendeesSet)
                .createdBy(currentUser)
                .build();

        DevMeeting saved = meetingRepository.save(meeting);

        // Parse Action Items
        if (request.getActionItems() != null) {
            String[] split = request.getActionItems().split("\n");
            for (String itemText : split) {
                if (!itemText.trim().isEmpty()) {
                    DevMeetingActionItem item = DevMeetingActionItem.builder()
                            .meeting(saved)
                            .text(itemText.trim())
                            .completed(false)
                            .build();
                    meetingActionItemRepository.save(item);
                }
            }
        }

        // Fetch saved with items populated
        return toMeetingResponse(meetingRepository.findById(saved.getId()).orElse(saved));
    }

    @Transactional
    public DevMeetingResponse updateMeeting(UUID id, DevMeetingRequest request) {
        DevMeeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DevMeeting", "id", id));
        
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (meeting.getCreatedBy() != null && !meeting.getCreatedBy().getId().equals(currentUserId)) {
            throw new UnauthorizedException("Only the creator of the meeting can edit it");
        }
        
        meeting.setTitle(request.getTitle());
        meeting.setTimeBlock(request.getTime());
        meeting.setLocation(request.getLocation());
        meeting.setAgenda(request.getAgenda());
        meeting.setDiscussion(request.getDiscussion());
        meeting.setDecisions(request.getDecisions());
        if (request.getDate() != null) {
            meeting.setMeetingDate(request.getDate());
        }

        if (request.getProject() != null) {
            DevProject project = projectRepository.findAll().stream()
                    .filter(p -> p.getName().equalsIgnoreCase(request.getProject()))
                    .findFirst()
                    .orElse(null);
            meeting.setProject(project);
        }

        if (request.getAttendees() != null) {
            Set<User> attendeesSet = new HashSet<>();
            for (String attendeeName : request.getAttendees()) {
                attendeesSet.add(resolveUserByName(attendeeName));
            }
            meeting.setAttendees(attendeesSet);
        }

        DevMeeting saved = meetingRepository.save(meeting);

        // Replace Action items if present
        if (request.getActionItems() != null) {
            meetingActionItemRepository.deleteAll(saved.getActionItems());
            saved.getActionItems().clear();
            
            String[] split = request.getActionItems().split("\n");
            for (String itemText : split) {
                if (!itemText.trim().isEmpty()) {
                    DevMeetingActionItem item = DevMeetingActionItem.builder()
                            .meeting(saved)
                            .text(itemText.trim())
                            .completed(false)
                            .build();
                    meetingActionItemRepository.save(item);
                }
            }
        }

        return toMeetingResponse(meetingRepository.findById(id).get());
    }

    @Transactional
    public void deleteMeeting(UUID id) {
        DevMeeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DevMeeting", "id", id));
        
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (meeting.getCreatedBy() != null && !meeting.getCreatedBy().getId().equals(currentUserId)) {
            throw new UnauthorizedException("Only the creator of the meeting can delete it");
        }
        meetingRepository.delete(meeting);
    }

    @Transactional
    public void toggleMeetingActionItem(UUID itemId) {
        DevMeetingActionItem item = meetingActionItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("DevMeetingActionItem", "id", itemId));
        item.setCompleted(!item.isCompleted());
        meetingActionItemRepository.save(item);
    }

    private DevMeetingResponse toMeetingResponse(DevMeeting m) {
        List<String> attendeeNames = m.getAttendees().stream()
                .map(this::getDisplayName)
                .collect(Collectors.toList());

        List<ActionItemResponse> actionItems = m.getActionItems().stream()
                .map(item -> ActionItemResponse.builder()
                        .id(item.getId())
                        .text(item.getText())
                        .completed(item.isCompleted())
                        .build())
                .collect(Collectors.toList());

        List<String> decisionsList = new ArrayList<>();
        if (m.getDecisions() != null && !m.getDecisions().isBlank()) {
            decisionsList = Arrays.stream(m.getDecisions().split("\n"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }

        return DevMeetingResponse.builder()
                .id(m.getId())
                .title(m.getTitle())
                .project(m.getProject() != null ? m.getProject().getName() : "General")
                .date(m.getMeetingDate())
                .time(m.getTimeBlock())
                .location(m.getLocation())
                .agenda(m.getAgenda())
                .discussion(m.getDiscussion())
                .decisions(decisionsList)
                .attendees(attendeeNames)
                .actionItems(actionItems)
                .createdBy(m.getCreatedBy() != null ? getDisplayName(m.getCreatedBy()) : "")
                .build();
    }

    // ─────────────────────────────────────────────
    // TECH DOCUMENTS (FILE MANAGER)
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<DevTechDocResponse> getTechDocsForUser(UUID userId) {
        return techDocRepository.findByUserId(userId).stream()
                .map(this::toTechDocResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DevTechDocResponse createTechDoc(DevTechDocRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new BadRequestException("Unauthorized access user profile."));

        DevTechDoc doc = DevTechDoc.builder()
                .user(user)
                .filename(request.getName())
                .content(request.getContent())
                .build();
        return toTechDocResponse(techDocRepository.save(doc));
    }

    @Transactional
    public DevTechDocResponse updateTechDoc(UUID id, DevTechDocRequest request) {
        DevTechDoc doc = techDocRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DevTechDoc", "id", id));
        doc.setFilename(request.getName());
        doc.setContent(request.getContent());
        return toTechDocResponse(techDocRepository.save(doc));
    }

    @Transactional
    public void deleteTechDoc(UUID id) {
        if (!techDocRepository.existsById(id)) {
            throw new ResourceNotFoundException("DevTechDoc", "id", id);
        }
        techDocRepository.deleteById(id);
    }

    private DevTechDocResponse toTechDocResponse(DevTechDoc d) {
        return DevTechDocResponse.builder()
                .id(d.getId())
                .name(d.getFilename())
                .content(d.getContent())
                .build();
    }

    // ─────────────────────────────────────────────
    // PROJECT UPDATES
    // ─────────────────────────────────────────────
    @Transactional
    public DevProjectUpdateResponse addProjectUpdate(UUID projectId, DevProjectUpdateRequest request) {
        DevProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("DevProject", "id", projectId));
        DevProjectUpdate update = DevProjectUpdate.builder()
                .project(project)
                .author(request.getAuthor())
                .updateText(request.getText())
                .date(LocalDate.now())
                .build();
        DevProjectUpdate saved = updateRepository.save(update);
        return DevProjectUpdateResponse.builder()
                .id(saved.getId())
                .author(saved.getAuthor())
                .text(saved.getUpdateText())
                .date(saved.getDate().toString())
                .build();
    }

    @Transactional
    public DevProjectUpdateResponse updateProjectUpdate(UUID updateId, DevProjectUpdateRequest request) {
        DevProjectUpdate update = updateRepository.findById(updateId)
                .orElseThrow(() -> new ResourceNotFoundException("DevProjectUpdate", "id", updateId));
        update.setUpdateText(request.getText());
        if (request.getAuthor() != null) {
            update.setAuthor(request.getAuthor());
        }
        DevProjectUpdate saved = updateRepository.save(update);
        return DevProjectUpdateResponse.builder()
                .id(saved.getId())
                .author(saved.getAuthor())
                .text(saved.getUpdateText())
                .date(saved.getDate().toString())
                .build();
    }

    @Transactional
    public void deleteProjectUpdate(UUID updateId) {
        if (!updateRepository.existsById(updateId)) {
            throw new ResourceNotFoundException("DevProjectUpdate", "id", updateId);
        }
        updateRepository.deleteById(updateId);
    }

    // ─────────────────────────────────────────────
    // PROJECT DOCUMENTS
    // ─────────────────────────────────────────────
    @Transactional
    public DevProjectDocumentResponse addProjectDocument(UUID projectId, DevProjectDocumentRequest request) {
        DevProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("DevProject", "id", projectId));
        DevProjectDocument doc = DevProjectDocument.builder()
                .project(project)
                .name(request.getName())
                .type(request.getType())
                .size(request.getSize())
                .fileUrl(request.getFileUrl())
                .mediaFileId(request.getMediaFileId())
                .build();
        DevProjectDocument saved = documentRepository.save(doc);
        return DevProjectDocumentResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .type(saved.getType())
                .size(saved.getSize())
                .fileUrl(saved.getFileUrl())
                .mediaFileId(saved.getMediaFileId())
                .build();
    }

    @Transactional
    public DevProjectDocumentResponse updateProjectDocument(UUID docId, DevProjectDocumentRequest request) {
        DevProjectDocument doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("DevProjectDocument", "id", docId));
        doc.setName(request.getName());
        if (request.getType() != null) {
            doc.setType(request.getType());
        }
        if (request.getSize() != null) {
            doc.setSize(request.getSize());
        }
        if (request.getFileUrl() != null) {
            doc.setFileUrl(request.getFileUrl());
        }
        if (request.getMediaFileId() != null) {
            doc.setMediaFileId(request.getMediaFileId());
        }
        DevProjectDocument saved = documentRepository.save(doc);
        return DevProjectDocumentResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .type(saved.getType())
                .size(saved.getSize())
                .fileUrl(saved.getFileUrl())
                .mediaFileId(saved.getMediaFileId())
                .build();
    }

    @Transactional
    public void deleteProjectDocument(UUID docId) {
        if (!documentRepository.existsById(docId)) {
            throw new ResourceNotFoundException("DevProjectDocument", "id", docId);
        }
        documentRepository.deleteById(docId);
    }

    // ─────────────────────────────────────────────
    // COMMON LOOKUP HELPERS
    // ─────────────────────────────────────────────
    private User resolveUserByName(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        return userRepository.findAllNonDeleted().stream()
                .filter(u -> name.equalsIgnoreCase(getDisplayName(u)) || name.equalsIgnoreCase(u.getUserCode()))
                .findFirst()
                .orElseGet(() -> {
                    // Fallback to currently logged-in user if not found
                    UUID currentUserId = SecurityUtils.getCurrentUserId();
                    return userRepository.findById(currentUserId).orElse(null);
                });
    }

    private String getDisplayName(User u) {
        if (u.getEmployeeProfile() != null && u.getEmployeeProfile().getFullName() != null) {
            return u.getEmployeeProfile().getFullName();
        }
        return u.getUserCode();
    }
}
