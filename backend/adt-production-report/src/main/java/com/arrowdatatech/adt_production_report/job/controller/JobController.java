package com.arrowdatatech.adt_production_report.job.controller;

import com.arrowdatatech.adt_production_report.common.audit.dto.PagedResponse;
import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.job.dto.*;
import com.arrowdatatech.adt_production_report.job.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    // GET /jobs/search - Filtered search
    // Used by: BooksJobs admin table
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader')")
    public ResponseEntity<ApiResponse<PagedResponse<JobResponse>>> searchJobs(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID clientId,
            @RequestParam(required = false) UUID workflowId,
            @RequestParam(required = false) String jobIdCode,
            @RequestParam(required = false) String xmlIsbn,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startMonthFrom,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startMonthTo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String billingStatus,
            @RequestParam(required = false) String complexity,
            @RequestParam(required = false) String fileStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Page<JobResponse> result = jobService.searchJobs(
                projectId, clientId, workflowId, jobIdCode, xmlIsbn,
                startMonthFrom, startMonthTo,
                status, billingStatus, complexity, fileStatus,
                page, size);

        PagedResponse<JobResponse> response = PagedResponse
                .<JobResponse>builder()
                .content(result.getContent())
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();

        return ResponseEntity.ok(
                ApiResponse.success("Jobs retrieved", response));
    }

    // GET /jobs/{id}
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader')")
    public ResponseEntity<ApiResponse<JobResponse>> getById(
            @PathVariable UUID id) {
        JobResponse job = jobService.getJobById(id);
        return ResponseEntity.ok(ApiResponse.success("Job retrieved", job));
    }

    // GET /jobs/by-project/{projectId}
    // Used by: Invoice line item population
    @GetMapping("/by-project/{projectId}")
    public ResponseEntity<ApiResponse<List<JobResponse>>> getByProject(
            @PathVariable UUID projectId) {
        List<JobResponse> jobs = jobService.getJobsByProject(projectId);
        return ResponseEntity.ok(ApiResponse.success("Jobs retrieved", jobs));
    }

    // POST /jobs - Create single job
    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader')")
    public ResponseEntity<ApiResponse<JobResponse>> createJob(
            @RequestBody CreateJobRequest request) {
        JobResponse created = jobService.createJob(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Job created", created));
    }

    // PUT /jobs/{id} - Update job
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader')")
    public ResponseEntity<ApiResponse<JobResponse>> updateJob(
            @PathVariable UUID id,
            @RequestBody CreateJobRequest request) {
        JobResponse updated = jobService.updateJob(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Job updated", updated));
    }

    // DELETE /jobs/{id} - Hard delete (confirmed by frontend)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader')")
    public ResponseEntity<ApiResponse<Void>> deleteJob(
            @PathVariable UUID id) {
        jobService.deleteJob(id);
        return ResponseEntity.ok(
                ApiResponse.success("Job deleted", null));
    }

    // POST /jobs/bulk-import - Bulk import from pasted data
    @PostMapping("/bulk-import")
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader')")
    public ResponseEntity<ApiResponse<BulkImportResponse>> bulkImport(
            @RequestBody BulkImportRequest request) {
        BulkImportResponse result = jobService.bulkImport(request);
        return ResponseEntity.ok(
                ApiResponse.success("Bulk import complete", result));
    }

    // POST /jobs/field-mapping/{projectId} - Save field mapping
    // Replaces localStorage in frontend
    @PostMapping("/field-mapping/{projectId}")
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader')")
    public ResponseEntity<ApiResponse<Void>> saveFieldMapping(
            @PathVariable UUID projectId,
            @RequestBody FieldMappingRequest request) {
        jobService.saveFieldMapping(projectId, request.getFieldOrder());
        return ResponseEntity.ok(
                ApiResponse.success("Field mapping saved", null));
    }

    // GET /jobs/field-mapping/{projectId} - Load field mapping
    @GetMapping("/field-mapping/{projectId}")
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader')")
    public ResponseEntity<ApiResponse<List<String>>> getFieldMapping(
            @PathVariable UUID projectId) {
        List<String> mapping = jobService.getFieldMapping(projectId);
        return ResponseEntity.ok(
                ApiResponse.success("Field mapping retrieved", mapping));
    }

    // POST /jobs/batch/{batchId}/rollback - Rollback import
    @PostMapping("/batch/{batchId}/rollback")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<Void>> rollbackBatch(
            @PathVariable UUID batchId) {
        jobService.rollbackBatch(batchId);
        return ResponseEntity.ok(
                ApiResponse.success("Batch rolled back", null));
    }

    // GET /jobs/production/search
    @GetMapping("/production/search")
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader')")
    public ResponseEntity<ApiResponse<PagedResponse<JobResponse>>> searchProductionJobs(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID clientId,
            @RequestParam(required = false) UUID workflowId,
            @RequestParam(required = false) String jobIdCode,
            @RequestParam(required = false) String complexity,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Page<JobResponse> result = jobService.searchProductionJobs(
                projectId, clientId, workflowId, jobIdCode, complexity,
                startDate, endDate, page, size);

        PagedResponse<JobResponse> response = PagedResponse
                .<JobResponse>builder()
                .content(result.getContent())
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();

        return ResponseEntity.ok(
                ApiResponse.success("Production jobs retrieved", response));
    }

    // PUT /jobs/{id}/production
    @PutMapping("/{id}/production")
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader')")
    public ResponseEntity<ApiResponse<JobResponse>> updateProductionStatus(
            @PathVariable UUID id,
            @RequestBody UpdateProductionRequest request) {
        JobResponse updated = jobService.updateProductionStatus(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Job production status updated", updated));
    }
}