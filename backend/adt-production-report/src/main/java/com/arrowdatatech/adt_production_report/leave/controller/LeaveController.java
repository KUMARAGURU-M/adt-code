package com.arrowdatatech.adt_production_report.leave.controller;

import com.arrowdatatech.adt_production_report.common.audit.dto.PagedResponse;
import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.leave.dto.*;
import com.arrowdatatech.adt_production_report.leave.service.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/leave")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    // ── Leave Types ────────────────────────────────────────────

    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<LeaveTypeDto>>> getTypes() {
        return ResponseEntity.ok(ApiResponse.success(
                "Leave types retrieved", leaveService.getAllLeaveTypes()));
    }

    @PostMapping("/types")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<LeaveTypeDto>> createType(
            @RequestBody CreateLeaveTypeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Leave type created",
                        leaveService.createLeaveType(req)));
    }

    @PutMapping("/types/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<LeaveTypeDto>> updateType(
            @PathVariable UUID id,
            @RequestBody CreateLeaveTypeRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Leave type updated",
                leaveService.updateLeaveType(id, req)));
    }

    @DeleteMapping("/types/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<Void>> deleteType(
            @PathVariable UUID id) {
        leaveService.deleteLeaveType(id);
        return ResponseEntity.ok(
                ApiResponse.success("Leave type deleted", null));
    }

    // ── Leave Policies ─────────────────────────────────────────

    @GetMapping("/policies")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<List<LeavePolicyDto>>> getPolicies() {
        return ResponseEntity.ok(ApiResponse.success(
                "Policies retrieved", leaveService.getAllPolicies()));
    }

    @PostMapping("/policies")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<LeavePolicyDto>> createPolicy(
            @RequestBody CreateLeavePolicyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Policy created",
                        leaveService.createPolicy(req)));
    }

    @PutMapping("/policies/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<LeavePolicyDto>> updatePolicy(
            @PathVariable UUID id,
            @RequestBody CreateLeavePolicyRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Policy updated",
                leaveService.updatePolicy(id, req)));
    }

    @DeleteMapping("/policies/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<Void>> deletePolicy(
            @PathVariable UUID id) {
        leaveService.deletePolicy(id);
        return ResponseEntity.ok(
                ApiResponse.success("Policy deleted", null));
    }

    // ── Leave Requests — Admin ─────────────────────────────────

    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<PagedResponse<LeaveRequestDto>>>
    searchRequests(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID leaveTypeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        Page<LeaveRequestDto> result = leaveService.searchRequests(
                userId, status, leaveTypeId, page, size);
        PagedResponse<LeaveRequestDto> resp = PagedResponse
                .<LeaveRequestDto>builder()
                .content(result.getContent())
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
        return ResponseEntity.ok(
                ApiResponse.success("Requests retrieved", resp));
    }

    @PostMapping("/requests")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> createRequest(
            @RequestBody CreateLeaveRequestRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Leave request created",
                        leaveService.createRequest(req)));
    }

    @PutMapping("/requests/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> updateRequest(
            @PathVariable UUID id,
            @RequestBody CreateLeaveRequestRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Request updated",
                leaveService.updateRequest(id, req)));
    }

    // PATCH /leave/requests/{id}/review — Approve or Reject
    @PatchMapping("/requests/{id}/review")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> reviewRequest(
            @PathVariable UUID id,
            @RequestBody ReviewLeaveRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Request reviewed",
                leaveService.reviewRequest(id, req)));
    }

    @DeleteMapping("/requests/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<Void>> deleteRequest(
            @PathVariable UUID id) {
        leaveService.deleteRequest(id);
        return ResponseEntity.ok(
                ApiResponse.success("Request deleted", null));
    }

    // ── Leave Requests — Employee ──────────────────────────────

    // GET /leave/my-requests  — employee's own requests
    @GetMapping("/my-requests")
    public ResponseEntity<ApiResponse<List<LeaveRequestDto>>> getMyRequests() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Requests retrieved",
                leaveService.getMyRequests(userId)));
    }

    // POST /leave/apply  — employee applies for leave
    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> applyLeave(
            @RequestBody CreateLeaveRequestRequest req) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Leave applied",
                        leaveService.applyLeave(userId, req)));
    }

    // PATCH /leave/my-requests/{id}/cancel  — employee cancels own request
    @PatchMapping("/my-requests/{id}/cancel")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> cancelMyLeave(
            @PathVariable UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Leave cancelled",
                leaveService.cancelMyLeave(userId, id)));
    }

    // ── Leave Balances ─────────────────────────────────────────

    // GET /leave/my-balance?year=2026
    @GetMapping("/my-balance")
    public ResponseEntity<ApiResponse<List<LeaveBalanceDto>>> getMyBalance(
            @RequestParam(defaultValue = "0") int year) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (year == 0) year = java.time.Year.now().getValue();
        return ResponseEntity.ok(ApiResponse.success("Balance retrieved",
                leaveService.getBalancesForUser(userId, year)));
    }

    // GET /leave/balances?year=2026  — admin view all balances
    @GetMapping("/balances")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<List<LeaveBalanceDto>>> getAllBalances(
            @RequestParam(defaultValue = "0") int year) {
        if (year == 0) year = java.time.Year.now().getValue();
        return ResponseEntity.ok(ApiResponse.success("Balances retrieved",
                leaveService.getAllBalances(year)));
    }

    // POST /leave/balances/allocate  — admin allocates leave
    @PostMapping("/balances/allocate")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<LeaveBalanceDto>> allocateBalance(
            @RequestBody Map<String, Object> body) {
        UUID userId      = UUID.fromString((String) body.get("userId"));
        UUID leaveTypeId = UUID.fromString((String) body.get("leaveTypeId"));
        int  year        = (int) body.get("year");
        BigDecimal days  = new BigDecimal(body.get("days").toString());
        return ResponseEntity.ok(ApiResponse.success("Balance allocated",
                leaveService.allocateBalance(
                        userId, leaveTypeId, year, days)));
    }
}