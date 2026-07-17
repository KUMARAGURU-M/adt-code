package com.arrowdatatech.adt_production_report.task.controller;

import com.arrowdatatech.adt_production_report.common.audit.dto.PagedResponse;
import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.task.dto.*;
import com.arrowdatatech.adt_production_report.task.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // GET /tasks/search - Filtered search with pagination
    // Used by: Task Management admin page table
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader') or hasAuthority('tasks.view')")
    public ResponseEntity<ApiResponse<PagedResponse<TaskResponse>>> searchTasks(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID clientId,
            @RequestParam(required = false) UUID workflowId,
            @RequestParam(required = false) UUID processId,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        Page<TaskResponse> result = taskService.searchTasks(
                projectId, clientId, workflowId, processId, userId, status, search, page, size);

        PagedResponse<TaskResponse> response = PagedResponse
                .<TaskResponse>builder()
                .content(result.getContent())
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();

        return ResponseEntity.ok(
                ApiResponse.success("Tasks retrieved", response));
    }

    // GET /tasks/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> getById(
            @PathVariable UUID id) {
        TaskResponse task = taskService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.success("Task retrieved", task));
    }

    // GET /tasks/my-tasks?userId=
    // Used by: Employee task list (EmpTask.js)
    @GetMapping("/my-tasks")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getMyTasks(
            @RequestParam UUID userId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (!currentUserId.equals(userId) && !SecurityUtils.hasRole("Admin")
                && !SecurityUtils.hasRole("Manager") && !SecurityUtils.hasRole("Team Leader")
                && !SecurityUtils.hasAuthority("tasks.view")) {
            throw new BadRequestException("You are not allowed to view other users' tasks.");
        }
        List<TaskResponse> tasks = taskService.getTasksForEmployee(userId);
        return ResponseEntity.ok(ApiResponse.success("Tasks retrieved", tasks));
    }

    // POST /tasks - Create task
    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader') or hasAuthority('tasks.create')")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @RequestBody CreateTaskRequest request) {
        TaskResponse created = taskService.createTask(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task created", created));
    }

    // PUT /tasks/{id} - Update task
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader') or hasAuthority('tasks.update')")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable UUID id,
            @RequestBody CreateTaskRequest request) {
        TaskResponse updated = taskService.updateTask(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Task updated", updated));
    }

    // PATCH /tasks/{id}/status - Status update only
    // Used by: Employee portal status change
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("status is required"));
        }
        TaskResponse updated = taskService.updateTaskStatus(id, status);
        return ResponseEntity.ok(
                ApiResponse.success("Status updated", updated));
    }

    // DELETE /tasks/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('tasks.delete')")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable UUID id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(
                ApiResponse.success("Task deleted", null));
    }

    // POST /tasks/remove-duplicates
    // Matches the "Remove Duplicates" button on frontend
    @PostMapping("/remove-duplicates")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('tasks.delete')")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> removeDuplicates() {
        int removed = taskService.removeDuplicates();
        return ResponseEntity.ok(
                ApiResponse.success(removed + " duplicates removed",
                        Map.of("removedCount", removed)));
    }
}

