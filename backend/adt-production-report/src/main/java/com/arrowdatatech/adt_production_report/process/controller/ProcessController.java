package com.arrowdatatech.adt_production_report.process.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.process.dto.CreateProcessRequest;
import com.arrowdatatech.adt_production_report.process.dto.ProcessResponse;
import com.arrowdatatech.adt_production_report.process.service.ProcessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/processes")
@RequiredArgsConstructor
public class ProcessController {

    private final ProcessService processService;

    // GET /processes - Active only
    // Used by: WorkWise dropdown, Task creation dropdowns
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProcessResponse>>> getAllActive() {
        List<ProcessResponse> processes =
                processService.getAllActiveProcesses();
        return ResponseEntity.ok(
                ApiResponse.success("Processes retrieved", processes));
    }

    // GET /processes/all - Including inactive
    // Used by: Process Management admin page table
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('processes.view')")
    public ResponseEntity<ApiResponse<List<ProcessResponse>>> getAll() {
        List<ProcessResponse> processes = processService.getAllProcesses();
        return ResponseEntity.ok(
                ApiResponse.success("All processes retrieved", processes));
    }

    // GET /processes/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProcessResponse>> getById(
            @PathVariable UUID id) {
        ProcessResponse process = processService.getProcessById(id);
        return ResponseEntity.ok(
                ApiResponse.success("Process retrieved", process));
    }

    // GET /processes/by-project/{projectId}
    // Used by: WorkWise process dropdown filtered by project
    @GetMapping("/by-project/{projectId}")
    public ResponseEntity<ApiResponse<List<ProcessResponse>>> getByProject(
            @PathVariable UUID projectId) {
        List<ProcessResponse> processes =
                processService.getProcessesByProject(projectId);
        return ResponseEntity.ok(
                ApiResponse.success("Processes retrieved", processes));
    }

    // GET /processes/my-processes
    // Used by: Employee WorkWise - only their assigned processes
    @GetMapping("/my-processes")
    public ResponseEntity<ApiResponse<List<ProcessResponse>>> getMyProcesses(
            @RequestParam UUID userId) {
        List<ProcessResponse> processes =
                processService.getProcessesForUser(userId);
        return ResponseEntity.ok(
                ApiResponse.success("Processes retrieved", processes));
    }

    // POST /processes - Create new process
    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('processes.manage')")
    public ResponseEntity<ApiResponse<ProcessResponse>> createProcess(
            @Valid @RequestBody CreateProcessRequest request) {
        ProcessResponse created = processService.createProcess(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Process created successfully", created));
    }

    // PUT /processes/{id} - Update process
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('processes.manage')")
    public ResponseEntity<ApiResponse<ProcessResponse>> updateProcess(
            @PathVariable UUID id,
            @Valid @RequestBody CreateProcessRequest request) {
        ProcessResponse updated = processService.updateProcess(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Process updated successfully", updated));
    }

    // DELETE /processes/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin') or hasAuthority('processes.manage')")
    public ResponseEntity<ApiResponse<Void>> deleteProcess(
            @PathVariable UUID id) {
        processService.deleteProcess(id);
        return ResponseEntity.ok(
                ApiResponse.success("Process deleted successfully", null));
    }
}