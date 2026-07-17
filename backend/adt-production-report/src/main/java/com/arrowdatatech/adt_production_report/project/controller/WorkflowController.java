package com.arrowdatatech.adt_production_report.project.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.project.dto.WorkflowRequest;
import com.arrowdatatech.adt_production_report.project.dto.WorkflowResponse;
import com.arrowdatatech.adt_production_report.project.service.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/projects/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkflowResponse>>> getAllWorkflows() {
        List<WorkflowResponse> workflows = workflowService.getAllWorkflows();
        return ResponseEntity.ok(ApiResponse.success("Workflows retrieved", workflows));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkflowResponse>> getWorkflowById(@PathVariable UUID id) {
        WorkflowResponse workflow = workflowService.getWorkflowById(id);
        return ResponseEntity.ok(ApiResponse.success("Workflow retrieved", workflow));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('projects.create')")
    public ResponseEntity<ApiResponse<WorkflowResponse>> createWorkflow(@Valid @RequestBody WorkflowRequest request) {
        WorkflowResponse created = workflowService.createWorkflow(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Workflow created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('projects.update')")
    public ResponseEntity<ApiResponse<WorkflowResponse>> updateWorkflow(
            @PathVariable UUID id,
            @Valid @RequestBody WorkflowRequest request) {
        WorkflowResponse updated = workflowService.updateWorkflow(id, request);
        return ResponseEntity.ok(ApiResponse.success("Workflow updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('projects.delete')")
    public ResponseEntity<ApiResponse<Void>> deleteWorkflow(@PathVariable UUID id) {
        workflowService.deleteWorkflow(id);
        return ResponseEntity.ok(ApiResponse.success("Workflow deleted successfully", null));
    }
}
