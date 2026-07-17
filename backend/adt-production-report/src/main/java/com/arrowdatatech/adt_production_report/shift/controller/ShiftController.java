package com.arrowdatatech.adt_production_report.shift.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.shift.dto.*;
import com.arrowdatatech.adt_production_report.shift.service.ShiftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftService shiftService;

    // GET /shifts - Active shifts only
    // Used by: Add User shift dropdown
    @GetMapping
    public ResponseEntity<ApiResponse<List<ShiftResponse>>> getActiveShifts() {
        List<ShiftResponse> shifts = shiftService.getAllActiveShifts();
        return ResponseEntity.ok(
                ApiResponse.success("Shifts retrieved", shifts));
    }

    // GET /shifts/all - All shifts with assigned employees
    // Used by: Shift Management admin page
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('shifts.view')")
    public ResponseEntity<ApiResponse<List<ShiftResponse>>> getAllShifts() {
        List<ShiftResponse> shifts =
                shiftService.getAllShiftsWithEmployees();
        return ResponseEntity.ok(
                ApiResponse.success("All shifts retrieved", shifts));
    }

    // GET /shifts/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShiftResponse>> getById(
            @PathVariable UUID id) {
        ShiftResponse shift = shiftService.getShiftById(id);
        return ResponseEntity.ok(
                ApiResponse.success("Shift retrieved", shift));
    }

    // GET /shifts/employees - All employees with current shift info
    // Used by: Allotment Board dropdown
    @GetMapping("/employees")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('shifts.view')")
    public ResponseEntity<ApiResponse<List<AllEmployeeForShiftResponse>>>
    getAllEmployeesWithShiftInfo() {
        List<AllEmployeeForShiftResponse> employees =
                shiftService.getAllEmployeesWithShiftInfo();
        return ResponseEntity.ok(
                ApiResponse.success("Employees retrieved", employees));
    }

    // GET /shifts/{id}/employees - Employees currently in a shift
    @GetMapping("/{id}/employees")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('shifts.view')")
    public ResponseEntity<ApiResponse<List<ShiftEmployeeResponse>>>
    getEmployeesForShift(@PathVariable UUID id) {
        List<ShiftEmployeeResponse> employees =
                shiftService.getEmployeesForShift(id);
        return ResponseEntity.ok(
                ApiResponse.success("Shift employees retrieved", employees));
    }

    // POST /shifts - Create shift
    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('shifts.manage')")
    public ResponseEntity<ApiResponse<ShiftResponse>> createShift(
            @Valid @RequestBody CreateShiftRequest request) {
        ShiftResponse created = shiftService.createShift(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Shift created successfully", created));
    }

    // PUT /shifts/{id} - Update shift
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('shifts.manage')")
    public ResponseEntity<ApiResponse<ShiftResponse>> updateShift(
            @PathVariable UUID id,
            @Valid @RequestBody CreateShiftRequest request) {
        ShiftResponse updated = shiftService.updateShift(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Shift updated successfully", updated));
    }

    // DELETE /shifts/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin') or hasAuthority('shifts.manage')")
    public ResponseEntity<ApiResponse<Void>> deleteShift(
            @PathVariable UUID id) {
        shiftService.deleteShift(id);
        return ResponseEntity.ok(
                ApiResponse.success("Shift deleted successfully", null));
    }

    // POST /shifts/{id}/assign - Assign employees to shift (Allotment Board)
    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('shifts.manage')")
    public ResponseEntity<ApiResponse<ShiftAssignmentResponse>> assignEmployees(
            @PathVariable UUID id,
            @Valid @RequestBody AssignShiftRequest request) {
        ShiftAssignmentResponse response =
                shiftService.assignEmployeesToShift(id, request);
        return ResponseEntity.ok(
                ApiResponse.success(response.getMessage(), response));
    }

    // DELETE /shifts/{shiftId}/employees/{userId}
    // Remove one employee from a shift
    @DeleteMapping("/{shiftId}/employees/{userId}")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('shifts.manage')")
    public ResponseEntity<ApiResponse<Void>> removeEmployee(
            @PathVariable UUID shiftId,
            @PathVariable UUID userId) {
        shiftService.removeEmployeeFromShift(shiftId, userId);
        return ResponseEntity.ok(
                ApiResponse.success("Employee removed from shift", null));
    }
}