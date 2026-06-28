package com.arrowdatatech.adt_production_report.report.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.report.service.ReportService;
import com.arrowdatatech.adt_production_report.workwise.dto.TimeLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('Admin','Manager','Team Leader')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<TimeLogResponse>>> getReportLogs(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        UUID targetUserId = (userId != null && !userId.isBlank() && !"All".equalsIgnoreCase(userId)) 
                ? UUID.fromString(userId) : null;
        UUID targetProjectId = (projectId != null && !projectId.isBlank() && !"All".equalsIgnoreCase(projectId)) 
                ? UUID.fromString(projectId) : null;
        String targetStatus = (status != null && !status.isBlank() && !"All".equalsIgnoreCase(status)) 
                ? status : null;

        List<TimeLogResponse> logs = reportService.getReportLogs(targetUserId, targetProjectId, targetStatus, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Report logs retrieved", logs));
    }
}
