package com.arrowdatatech.adt_production_report.jobopening.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.jobopening.dto.JobOpeningRequest;
import com.arrowdatatech.adt_production_report.jobopening.dto.JobOpeningResponse;
import com.arrowdatatech.adt_production_report.jobopening.service.JobOpeningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class JobOpeningController {

    private final JobOpeningService service;

    /** Public — active job openings for the Careers page */
    @GetMapping("/public/careers/openings")
    public ResponseEntity<ApiResponse<List<JobOpeningResponse>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success("OK", service.getActive()));
    }

    /** Admin — all job openings */
    @GetMapping("/admin/careers/openings")
    public ResponseEntity<ApiResponse<List<JobOpeningResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("OK", service.getAll()));
    }

    /** Admin — create a job opening */
    @PostMapping("/admin/careers/openings")
    public ResponseEntity<ApiResponse<JobOpeningResponse>> create(
            @Valid @RequestBody JobOpeningRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Created", service.create(req)));
    }

    /** Admin — update a job opening */
    @PutMapping("/admin/careers/openings/{id}")
    public ResponseEntity<ApiResponse<JobOpeningResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody JobOpeningRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Updated", service.update(id, req)));
    }

    /** Admin — toggle active/inactive */
    @PutMapping("/admin/careers/openings/{id}/toggle")
    public ResponseEntity<ApiResponse<JobOpeningResponse>> toggle(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Toggled", service.toggleActive(id)));
    }

    /** Admin — delete */
    @DeleteMapping("/admin/careers/openings/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }
}
