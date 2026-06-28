package com.arrowdatatech.adt_production_report.workwise.controller;

import com.arrowdatatech.adt_production_report.common.audit.dto.PagedResponse;
import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.workwise.dto.*;
import com.arrowdatatech.adt_production_report.workwise.service.WorkwiseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;


@RestController
@RequestMapping("/workwise")
@RequiredArgsConstructor
public class WorkwiseController {

    private final WorkwiseService workwiseService;

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<WorkwiseContextResponse>> getCurrent() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Current task",
                workwiseService.getCurrentTask(userId)));
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<ApiResponse<List<MyTaskOption>>> getMyTasks() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Tasks retrieved",
                workwiseService.getMyTaskOptions(userId)));
    }

    @GetMapping("/next-task")
    public ResponseEntity<ApiResponse<MyTaskOption>> getNextTask() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Next task",
                workwiseService.getNextTask(userId)));
    }

    // Validate whether Complete is allowed
    @GetMapping("/stop-validation/{timeLogId}")
    public ResponseEntity<ApiResponse<StopValidationResponse>> validateStop(
            @PathVariable UUID timeLogId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Validation result",
                workwiseService.validateStop(userId, timeLogId)));
    }

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<WorkwiseContextResponse>> startTask(
            @RequestBody StartTaskRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Task started",
                workwiseService.startTask(userId, request)));
    }

    // Returns StopTaskResponse (includes nextTask)
    @PostMapping("/stop")
    public ResponseEntity<ApiResponse<StopTaskResponse>> stopTask(
            @RequestBody StopTaskRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Task stopped",
                workwiseService.stopTask(userId, request)));
    }

    @PostMapping("/break/start")
    public ResponseEntity<ApiResponse<WorkwiseContextResponse>> startBreak(
            @RequestBody StartBreakRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Break started",
                workwiseService.startBreak(userId, request)));
    }

    @PostMapping("/break/end")
    public ResponseEntity<ApiResponse<WorkwiseContextResponse>> endBreak(
            @RequestBody Map<String, String> body) {
        UUID userId    = SecurityUtils.getCurrentUserId();
        UUID timeLogId = UUID.fromString(body.get("timeLogId"));
        return ResponseEntity.ok(ApiResponse.success("Break ended",
                workwiseService.endBreak(userId, timeLogId)));
    }

    @GetMapping("/calendar-stats")
    public ResponseEntity<ApiResponse<CalendarStatsResponse>> getCalendarStats(
            @RequestParam int year,
            @RequestParam int month) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Calendar stats retrieved",
                workwiseService.getCalendarStats(userId, year, month)));
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<PagedResponse<TimeLogResponse>>> getLogs(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID processId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "25") int size) {

        UUID userId = SecurityUtils.getCurrentUserId();
        Page<TimeLogResponse> result = workwiseService.getMyTimeLogs(
                userId, projectId, processId,
                status, startDate, endDate, page, size);

        PagedResponse<TimeLogResponse> response = PagedResponse
                .<TimeLogResponse>builder()
                .content(result.getContent())
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();

        return ResponseEntity.ok(
                ApiResponse.success("Time logs retrieved", response));
    }

    @GetMapping("/admin/logs")
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader')")
    public ResponseEntity<ApiResponse<List<TimeLogResponse>>> getAdminLogs(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String processId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        UUID targetUserId = (userId != null && !userId.isBlank() && !"All".equalsIgnoreCase(userId)) 
                ? UUID.fromString(userId) : null;
        UUID targetProjectId = (projectId != null && !projectId.isBlank() && !"All".equalsIgnoreCase(projectId)) 
                ? UUID.fromString(projectId) : null;
        UUID targetProcessId = (processId != null && !processId.isBlank() && !"All".equalsIgnoreCase(processId)) 
                ? UUID.fromString(processId) : null;
        String targetStatus = (status != null && !status.isBlank() && !"All".equalsIgnoreCase(status)) 
                ? status : null;

        List<TimeLogResponse> result = workwiseService.getAdminTimeLogs(
                targetUserId, targetProjectId, targetProcessId, targetStatus, startDate, endDate);

        return ResponseEntity.ok(
                ApiResponse.success("Time logs retrieved", result));
    }
}