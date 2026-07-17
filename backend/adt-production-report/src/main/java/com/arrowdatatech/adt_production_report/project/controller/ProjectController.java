package com.arrowdatatech.adt_production_report.project.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.project.dto.CreateProjectRequest;
import com.arrowdatatech.adt_production_report.project.dto.ProjectResponse;
import com.arrowdatatech.adt_production_report.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // GET /projects - Active projects list
    // Used by: WorkWise dropdown, Task creation, Invoice
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getAllProjects() {
        List<ProjectResponse> projects = projectService.getAllProjects();
        return ResponseEntity.ok(
                ApiResponse.success("Projects retrieved", projects));
    }

    // GET /projects/all - Including inactive
    // Used by: Admin Project Management page
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('projects.view')")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getAllIncludingInactive() {
        List<ProjectResponse> projects =
                projectService.getAllProjectsIncludingInactive();
        return ResponseEntity.ok(
                ApiResponse.success("All projects retrieved", projects));
    }

    // GET /projects/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProjectById(
            @PathVariable UUID id) {
        ProjectResponse project = projectService.getProjectById(id);
        return ResponseEntity.ok(
                ApiResponse.success("Project retrieved", project));
    }

    // POST /projects - Create new project
    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('projects.create')")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @Valid @RequestBody CreateProjectRequest request) {
        ProjectResponse created = projectService.createProject(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Project created successfully", created));
    }

    // PUT /projects/{id} - Update project
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('projects.update')")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable UUID id,
            @Valid @RequestBody CreateProjectRequest request) {
        ProjectResponse updated = projectService.updateProject(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Project updated successfully", updated));
    }

    // PATCH /projects/{id}/billing-type - Inline billing type change
    // Used by: inline dropdown in project table
    @PatchMapping("/{id}/billing-type")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('projects.update')")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateBillingType(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String billingType = body.get("billingType");
        if (billingType == null || billingType.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("billingType is required"));
        }
        ProjectResponse updated =
                projectService.updateBillingType(id, billingType);
        return ResponseEntity.ok(
                ApiResponse.success("Billing type updated", updated));
    }

    // DELETE /projects/{id} - Soft delete
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin') or hasAuthority('projects.delete')")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @PathVariable UUID id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(
                ApiResponse.success("Project deleted successfully", null));
    }

    // GET /projects/by-client/{clientId}
    // Used by: Invoice project selection dropdown
    @GetMapping("/by-client/{clientId}")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getByClient(
            @PathVariable UUID clientId) {
        List<ProjectResponse> projects =
                projectService.getProjectsByClient(clientId);
        return ResponseEntity.ok(
                ApiResponse.success("Projects retrieved", projects));
    }
}