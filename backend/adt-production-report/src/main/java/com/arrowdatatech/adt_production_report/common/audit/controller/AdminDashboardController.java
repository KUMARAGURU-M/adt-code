package com.arrowdatatech.adt_production_report.common.audit.controller;

import com.arrowdatatech.adt_production_report.common.audit.dto.AdminDashboardResponse;
import com.arrowdatatech.adt_production_report.common.audit.service.AdminDashboardService;
import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('Admin','Manager','Team Leader')")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats retrieved",
                adminDashboardService.getDashboardStats()));
    }
}
