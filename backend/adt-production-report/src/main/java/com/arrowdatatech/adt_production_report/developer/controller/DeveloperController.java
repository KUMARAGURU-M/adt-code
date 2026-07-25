package com.arrowdatatech.adt_production_report.developer.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.developer.service.DeveloperService;
import com.arrowdatatech.adt_production_report.project.dto.DevProjectDtos.*;
import com.arrowdatatech.adt_production_report.task.dto.DevTaskDtos.*;
import com.arrowdatatech.adt_production_report.correction.dto.DevCorrectionDtos.*;
import com.arrowdatatech.adt_production_report.overtime.dto.DevOvertimeDtos.*;
import com.arrowdatatech.adt_production_report.meeting.dto.DevMeetingDtos.*;
import com.arrowdatatech.adt_production_report.techdocs.dto.DevTechDocDtos.*;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/developer")
@RequiredArgsConstructor
public class DeveloperController {

    private final DeveloperService developerService;

    // ─────────────────────────────────────────────
    // DEV PROJECTS
    // ─────────────────────────────────────────────
    @GetMapping("/projects")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_projects.view')")
    public ResponseEntity<ApiResponse<List<DevProjectResponse>>> getProjects() {
        return ResponseEntity.ok(ApiResponse.success("Projects retrieved", developerService.getAllProjects()));
    }

    @PostMapping("/projects")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_projects.create')")
    public ResponseEntity<ApiResponse<DevProjectResponse>> createProject(@RequestBody DevProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created", developerService.createProject(request)));
    }

    @PutMapping("/projects/{id}")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_projects.update')")
    public ResponseEntity<ApiResponse<DevProjectResponse>> updateProject(@PathVariable UUID id, @RequestBody DevProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Project updated", developerService.updateProject(id, request)));
    }

    @DeleteMapping("/projects/{id}")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_projects.delete')")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable UUID id) {
        developerService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success("Project deleted", null));
    }

    // ─────────────────────────────────────────────
    // PROJECT UPDATES CRUD
    // ─────────────────────────────────────────────
    @PostMapping("/projects/{projectId}/updates")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_projects.update')")
    public ResponseEntity<ApiResponse<DevProjectUpdateResponse>> addProjectUpdate(
            @PathVariable UUID projectId,
            @RequestBody DevProjectUpdateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project update created", developerService.addProjectUpdate(projectId, request)));
    }

    @PutMapping("/projects/updates/{updateId}")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_projects.update')")
    public ResponseEntity<ApiResponse<DevProjectUpdateResponse>> updateProjectUpdate(
            @PathVariable UUID updateId,
            @RequestBody DevProjectUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Project update updated", developerService.updateProjectUpdate(updateId, request)));
    }

    @DeleteMapping("/projects/updates/{updateId}")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_projects.delete')")
    public ResponseEntity<ApiResponse<Void>> deleteProjectUpdate(@PathVariable UUID updateId) {
        developerService.deleteProjectUpdate(updateId);
        return ResponseEntity.ok(ApiResponse.success("Project update deleted", null));
    }

    // ─────────────────────────────────────────────
    // PROJECT DOCUMENTS CRUD
    // ─────────────────────────────────────────────
    @PostMapping("/projects/{projectId}/documents")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_projects.update')")
    public ResponseEntity<ApiResponse<DevProjectDocumentResponse>> addProjectDocument(
            @PathVariable UUID projectId,
            @RequestBody DevProjectDocumentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project document created", developerService.addProjectDocument(projectId, request)));
    }

    @PutMapping("/projects/documents/{docId}")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_projects.update')")
    public ResponseEntity<ApiResponse<DevProjectDocumentResponse>> updateProjectDocument(
            @PathVariable UUID docId,
            @RequestBody DevProjectDocumentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Project document updated", developerService.updateProjectDocument(docId, request)));
    }

    @DeleteMapping("/projects/documents/{docId}")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_projects.delete')")
    public ResponseEntity<ApiResponse<Void>> deleteProjectDocument(@PathVariable UUID docId) {
        developerService.deleteProjectDocument(docId);
        return ResponseEntity.ok(ApiResponse.success("Project document deleted", null));
    }

    // ─────────────────────────────────────────────
    // DEV TASKS
    // ─────────────────────────────────────────────
    @GetMapping("/tasks")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_tasks.view')")
    public ResponseEntity<ApiResponse<List<DevTaskResponse>>> getTasks(@RequestParam(required = false) UUID userId) {
        if (userId != null) {
            return ResponseEntity.ok(ApiResponse.success("Tasks retrieved", developerService.getTasksForUser(userId)));
        }
        return ResponseEntity.ok(ApiResponse.success("Tasks retrieved", developerService.getAllTasks()));
    }

    @PostMapping("/tasks")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_tasks.create')")
    public ResponseEntity<ApiResponse<DevTaskResponse>> createTask(@RequestBody DevTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task created", developerService.createTask(request)));
    }

    @PutMapping("/tasks/{id}")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_tasks.update')")
    public ResponseEntity<ApiResponse<DevTaskResponse>> updateTask(@PathVariable UUID id, @RequestBody DevTaskRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Task updated", developerService.updateTask(id, request)));
    }

    @DeleteMapping("/tasks/{id}")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_tasks.delete')")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable UUID id) {
        developerService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.success("Task deleted", null));
    }

    // ─────────────────────────────────────────────
    // DEV CORRECTIONS
    // ─────────────────────────────────────────────
    @GetMapping("/corrections")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_corrections.view')")
    public ResponseEntity<ApiResponse<List<DevCorrectionResponse>>> getCorrections(@RequestParam(required = false) UUID userId) {
        if (userId != null) {
            return ResponseEntity.ok(ApiResponse.success("Corrections retrieved", developerService.getCorrectionsForUser(userId)));
        }
        return ResponseEntity.ok(ApiResponse.success("Corrections retrieved", developerService.getAllCorrections()));
    }

    @PostMapping("/corrections")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_corrections.create')")
    public ResponseEntity<ApiResponse<DevCorrectionResponse>> createCorrection(@RequestBody DevCorrectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Correction created", developerService.createCorrection(request)));
    }

    @PutMapping("/corrections/{id}")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_corrections.update')")
    public ResponseEntity<ApiResponse<DevCorrectionResponse>> updateCorrection(@PathVariable UUID id, @RequestBody DevCorrectionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Correction updated", developerService.updateCorrection(id, request)));
    }

    @PatchMapping("/corrections/{id}/resolve")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_corrections.update')")
    public ResponseEntity<ApiResponse<DevCorrectionResponse>> resolveCorrection(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Correction resolved", developerService.resolveCorrection(id)));
    }

    // ─────────────────────────────────────────────
    // DEV MEETINGS
    // ─────────────────────────────────────────────
    @GetMapping("/meetings")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_meetings.view')")
    public ResponseEntity<ApiResponse<List<DevMeetingResponse>>> getMeetings() {
        return ResponseEntity.ok(ApiResponse.success("Meetings retrieved", developerService.getAllMeetings()));
    }

    @PostMapping("/meetings")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_meetings.create')")
    public ResponseEntity<ApiResponse<DevMeetingResponse>> createMeeting(@RequestBody DevMeetingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Meeting created", developerService.createMeeting(request)));
    }

    @PutMapping("/meetings/{id}")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_meetings.update')")
    public ResponseEntity<ApiResponse<DevMeetingResponse>> updateMeeting(@PathVariable UUID id, @RequestBody DevMeetingRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Meeting updated", developerService.updateMeeting(id, request)));
    }

    @DeleteMapping("/meetings/{id}")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_meetings.delete')")
    public ResponseEntity<ApiResponse<Void>> deleteMeeting(@PathVariable UUID id) {
        developerService.deleteMeeting(id);
        return ResponseEntity.ok(ApiResponse.success("Meeting deleted", null));
    }

    @PatchMapping("/meetings/action-item/{itemId}/toggle")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_meetings.update')")
    public ResponseEntity<ApiResponse<Void>> toggleMeetingActionItem(@PathVariable UUID itemId) {
        developerService.toggleMeetingActionItem(itemId);
        return ResponseEntity.ok(ApiResponse.success("Action item status toggled", null));
    }

    // ─────────────────────────────────────────────
    // DEV OVERTIME
    // ─────────────────────────────────────────────
    @GetMapping("/overtime")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_workwise.view')")
    public ResponseEntity<ApiResponse<List<DevOvertimeResponse>>> getOvertime(@RequestParam(required = false) UUID userId) {
        if (userId != null) {
            return ResponseEntity.ok(ApiResponse.success("Overtime logs retrieved", developerService.getOvertimeForUser(userId)));
        }
        return ResponseEntity.ok(ApiResponse.success("Overtime logs retrieved", developerService.getAllOvertime()));
    }

    @PostMapping("/overtime")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_workwise.create')")
    public ResponseEntity<ApiResponse<DevOvertimeResponse>> createOvertime(@RequestBody DevOvertimeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Overtime requested", developerService.createOvertime(request)));
    }

    @GetMapping("/overtime/today")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_workwise.view')")
    public ResponseEntity<ApiResponse<DevOvertimeResponse>> getTodayOvertime() {
        UUID userId = SecurityUtils.getCurrentUserId();
        DevOvertimeResponse result = developerService.getTodayOvertime(userId);
        return ResponseEntity.ok(ApiResponse.success("Today's overtime retrieved", result));
    }

    @PostMapping("/overtime/check-in")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_workwise.create')")
    public ResponseEntity<ApiResponse<DevOvertimeResponse>> checkInOvertime() {
        DevOvertimeResponse result = developerService.checkInOvertime();
        return ResponseEntity.ok(ApiResponse.success("Overtime started successfully", result));
    }

    @PostMapping("/overtime/check-out")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_workwise.create')")
    public ResponseEntity<ApiResponse<DevOvertimeResponse>> checkOutOvertime() {
        DevOvertimeResponse result = developerService.checkOutOvertime();
        return ResponseEntity.ok(ApiResponse.success("Overtime completed successfully", result));
    }

    @PatchMapping("/overtime/{id}/review")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_workwise.approve')")
    public ResponseEntity<ApiResponse<DevOvertimeResponse>> reviewOvertime(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> body) {
        Boolean approve = body.getOrDefault("approve", true);
        UUID approverId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Overtime status updated", developerService.approveOvertime(id, approverId, approve)));
    }

    // ─────────────────────────────────────────────
    // DEV TECH DOCS
    // ─────────────────────────────────────────────
    @GetMapping("/tech-docs")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_dashboard.view')")
    public ResponseEntity<ApiResponse<List<DevTechDocResponse>>> getTechDocs() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Documents retrieved", developerService.getTechDocsForUser(currentUserId)));
    }

    @PostMapping("/tech-docs")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_dashboard.update')")
    public ResponseEntity<ApiResponse<DevTechDocResponse>> createTechDoc(@RequestBody DevTechDocRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document created", developerService.createTechDoc(request)));
    }

    @PutMapping("/tech-docs/{id}")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_dashboard.update')")
    public ResponseEntity<ApiResponse<DevTechDocResponse>> updateTechDoc(@PathVariable UUID id, @RequestBody DevTechDocRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Document updated", developerService.updateTechDoc(id, request)));
    }

    @DeleteMapping("/tech-docs/{id}")
    @PreAuthorize("hasAnyRole('Admin') or hasAuthority('developer_dashboard.delete')")
    public ResponseEntity<ApiResponse<Void>> deleteTechDoc(@PathVariable UUID id) {
        developerService.deleteTechDoc(id);
        return ResponseEntity.ok(ApiResponse.success("Document deleted", null));
    }
}
