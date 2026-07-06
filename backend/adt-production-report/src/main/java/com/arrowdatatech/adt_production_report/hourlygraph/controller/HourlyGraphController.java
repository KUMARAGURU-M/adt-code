package com.arrowdatatech.adt_production_report.hourlygraph.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.hourlygraph.dto.HourlyGraphDtos.*;
import com.arrowdatatech.adt_production_report.hourlygraph.service.HourlyGraphService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/hourly-graph")
@RequiredArgsConstructor
public class HourlyGraphController {

    private final HourlyGraphService hourlyGraphService;

    // GET /hourly-graph/settings - Get targets dynamic layout configuration
    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<HourlyGraphSettingsResponse>> getSettings() {
        HourlyGraphSettingsResponse settings = hourlyGraphService.getSettings();
        return ResponseEntity.ok(ApiResponse.success("Hourly graph settings retrieved", settings));
    }

    // POST /hourly-graph/settings - Save target groups/columns and project values
    @PostMapping("/settings")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<HourlyGraphSettingsResponse>> saveSettings(
            @Valid @RequestBody SaveSettingsRequest request) {
        HourlyGraphSettingsResponse settings = hourlyGraphService.saveSettings(request);
        return ResponseEntity.ok(ApiResponse.success("Hourly graph settings saved successfully", settings));
    }

    // GET /hourly-graph/logs - Get employee logs for a given date (defaults to today)
    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<HourlyGraphResponse>> getDailyLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        HourlyGraphResponse logs = hourlyGraphService.getDailyLogs(targetDate);
        return ResponseEntity.ok(ApiResponse.success("Hourly logs retrieved", logs));
    }

    // POST /hourly-graph/logs - Save daily production hourly logs for employees
    @PostMapping("/logs")
    public ResponseEntity<ApiResponse<Void>> saveDailyLogs(
            @Valid @RequestBody SaveHourlyLogsRequest request) {
        LocalDate targetDate = request.getDate() != null ? request.getDate() : LocalDate.now();
        hourlyGraphService.saveDailyLogs(targetDate, request);
        return ResponseEntity.ok(ApiResponse.success("Hourly logs saved successfully", null));
    }

    // POST /hourly-graph/users/{userId}/toggle-visibility - Exclude/include employee from the hourly logs list
    @PostMapping("/users/{userId}/toggle-visibility")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<Void>> toggleEmployeeVisibility(
            @PathVariable UUID userId,
            @RequestBody ToggleVisibilityRequest request) {
        hourlyGraphService.toggleEmployeeVisibility(userId, request.isExclude());
        String msg = request.isExclude() ? "Employee excluded from Hourly Graph" : "Employee included in Hourly Graph";
        return ResponseEntity.ok(ApiResponse.success(msg, null));
    }
}
