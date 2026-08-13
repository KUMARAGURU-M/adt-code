package com.arrowdatatech.adt_production_report.project_target.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.project_target.dto.ProjectTargetRequest;
import com.arrowdatatech.adt_production_report.project_target.dto.ProjectTargetResponse;
import com.arrowdatatech.adt_production_report.project_target.dto.ProjectTargetDetailResponse;
import com.arrowdatatech.adt_production_report.project_target.dto.BulkProjectTargetRequest;
import com.arrowdatatech.adt_production_report.project_target.service.ProjectTargetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/targets")
@RequiredArgsConstructor
public class ProjectTargetController {

    private final ProjectTargetService targetService;

    // GET /targets - Get targets report for a selected year and month
    @GetMapping
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('monthly_targets.view')")
    public ResponseEntity<ApiResponse<List<ProjectTargetResponse>>> getTargetsReport(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        int targetYear = year != null ? year : LocalDate.now().getYear();
        int targetMonth = month != null ? month : LocalDate.now().getMonthValue();

        List<ProjectTargetResponse> report = targetService.getTargetsReport(targetYear, targetMonth);
        return ResponseEntity.ok(
                ApiResponse.success("Targets retrieved for " + targetMonth + "/" + targetYear, report));
    }

    // POST /targets - Set/Update targets
    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('monthly_targets.manage')")
    public ResponseEntity<ApiResponse<ProjectTargetResponse>> saveTarget(
            @Valid @RequestBody ProjectTargetRequest request) {

        ProjectTargetResponse updated = targetService.saveTarget(request);
        return ResponseEntity.ok(
                ApiResponse.success("Target saved successfully", updated));
    }

    // GET /targets/project/{projectId} - Get complete details for a single project
    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('monthly_targets.view')")
    public ResponseEntity<ApiResponse<ProjectTargetDetailResponse>> getProjectTargetDetail(
            @PathVariable java.util.UUID projectId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        int targetYear = year != null ? year : java.time.LocalDate.now().getYear();
        int targetMonth = month != null ? month : java.time.LocalDate.now().getMonthValue();

        ProjectTargetDetailResponse detail = targetService.getProjectTargetDetail(projectId, targetYear, targetMonth);
        return ResponseEntity.ok(
                ApiResponse.success("Project detail retrieved", detail));
    }

    // POST /targets/bulk - Configure targets for multiple projects of a client at once
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('monthly_targets.manage')")
    public ResponseEntity<ApiResponse<List<ProjectTargetResponse>>> saveBulkTargets(
            @Valid @RequestBody BulkProjectTargetRequest request) {

        List<ProjectTargetResponse> updatedList = targetService.saveBulkTargets(request);
        return ResponseEntity.ok(
                ApiResponse.success("Client targets applied successfully", updatedList));
    }
}
