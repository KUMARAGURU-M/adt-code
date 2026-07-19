package com.arrowdatatech.adt_production_report.attendance.controller;

import com.arrowdatatech.adt_production_report.attendance.dto.*;
import com.arrowdatatech.adt_production_report.attendance.service.AttendanceService;
import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    // ── Employees ──────────────────────────────────────────────

    // GET /attendance/employees
    @GetMapping("/employees")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('attendance.view')")
    public ResponseEntity<ApiResponse<List<AttendanceEmployeeResponse>>>
    getEmployees(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String name) {

        List<AttendanceEmployeeResponse> employees =
                attendanceService.getEmployees(category, name);
        return ResponseEntity.ok(
                ApiResponse.success("Employees retrieved", employees));
    }

    // POST /attendance/employees
    @PostMapping("/employees")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('attendance.update')")
    public ResponseEntity<ApiResponse<AttendanceEmployeeResponse>>
    createEmployee(
            @RequestBody CreateAttendanceEmployeeRequest request) {

        AttendanceEmployeeResponse emp =
                attendanceService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Employee created", emp));
    }

    // PUT /attendance/employees/{id}
    @PutMapping("/employees/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('attendance.update')")
    public ResponseEntity<ApiResponse<AttendanceEmployeeResponse>>
    updateEmployee(
            @PathVariable UUID id,
            @RequestBody CreateAttendanceEmployeeRequest request) {

        AttendanceEmployeeResponse emp =
                attendanceService.updateEmployee(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Employee updated", emp));
    }

    // DELETE /attendance/employees/{id}
    @DeleteMapping("/employees/{id}")
    @PreAuthorize("hasRole('Admin') or hasAuthority('attendance.update')")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(
            @PathVariable UUID id) {

        attendanceService.deleteEmployee(id);
        return ResponseEntity.ok(
                ApiResponse.success("Employee deleted", null));
    }

    // ── Monthly Attendance ─────────────────────────────────────

    // GET /attendance/monthly?year=2026&month=4
    // Returns employees + attendance grid + salary details for month
    @GetMapping("/monthly")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('attendance.view')")
    public ResponseEntity<ApiResponse<MonthlyAttendanceResponse>>
    getMonthly(
            @RequestParam int year,
            @RequestParam int month) {

        MonthlyAttendanceResponse data =
                attendanceService.getMonthlyAttendance(year, month);
        return ResponseEntity.ok(
                ApiResponse.success("Monthly attendance retrieved", data));
    }

    // DELETE /attendance/monthly?year=2026&month=4
    @DeleteMapping("/monthly")
    @PreAuthorize("hasRole('Admin') or hasAuthority('attendance.update')")
    public ResponseEntity<ApiResponse<Void>>
    clearMonthly(
            @RequestParam int year,
            @RequestParam int month) {

        attendanceService.clearMonthlyAttendance(year, month);
        return ResponseEntity.ok(
                ApiResponse.success("Monthly attendance cleared", null));
    }

    // POST /attendance/monthly/save
    // Bulk save entire month's attendance
    @PostMapping("/monthly/save")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('attendance.update')")
    public ResponseEntity<ApiResponse<Void>> saveMonthly(
            @RequestBody BulkAttendanceRequest request) {

        attendanceService.saveMonthlyAttendance(request);
        return ResponseEntity.ok(
                ApiResponse.success("Attendance saved", null));
    }

    // PATCH /attendance/cell
    // Real-time single cell update on every click
    @PatchMapping("/cell")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('attendance.update')")
    public ResponseEntity<ApiResponse<Void>> updateCell(
            @RequestBody Map<String, String> body) {

        UUID employeeId = UUID.fromString(body.get("employeeId"));
        LocalDate date  = LocalDate.parse(body.get("date")); // YYYY-MM-DD
        String status   = body.get("status");

        attendanceService.updateSingleCell(employeeId, date, status);
        return ResponseEntity.ok(
                ApiResponse.success("Cell updated", null));
    }

    // POST /attendance/quick-mark
    // Mark all employees for a specific day
    @PostMapping("/quick-mark")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('attendance.update')")
    public ResponseEntity<ApiResponse<Void>> quickMark(
            @RequestBody Map<String, Object> body) {

        int year   = (int) body.get("year");
        int month  = (int) body.get("month");
        int day    = (int) body.get("day");
        String status = (String) body.get("status");

        attendanceService.quickMarkDay(year, month, day, status);
        return ResponseEntity.ok(
                ApiResponse.success("Day marked", null));
    }

    // ── Salary Details ─────────────────────────────────────────

    // POST /attendance/salary-detail
    // Upsert salary detail for one employee for a month
    @PostMapping("/salary-detail")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('attendance.update')")
    public ResponseEntity<ApiResponse<SalaryDetailDto>> updateSalaryDetail(
            @RequestBody UpdateSalaryDetailRequest request) {

        SalaryDetailDto result =
                attendanceService.updateSalaryDetail(request);
        return ResponseEntity.ok(
                ApiResponse.success("Salary detail updated", result));
    }

    // ── Check-in / Check-out ───────────────────────────────────

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<AttendanceRecordResponse>> getTodayRecord() {
        UUID userId = SecurityUtils.getCurrentUserId();
        AttendanceRecordResponse result = attendanceService.getTodayRecord(userId);
        return ResponseEntity.ok(ApiResponse.success("Today record retrieved", result));
    }

    @PostMapping("/check-in")
    public ResponseEntity<ApiResponse<AttendanceRecordResponse>> checkIn() {
        UUID userId = SecurityUtils.getCurrentUserId();
        AttendanceRecordResponse result = attendanceService.checkIn(userId);
        return ResponseEntity.ok(ApiResponse.success("Checked in successfully", result));
    }

    @PostMapping("/check-out")
    public ResponseEntity<ApiResponse<AttendanceRecordResponse>> checkOut() {
        UUID userId = SecurityUtils.getCurrentUserId();
        AttendanceRecordResponse result = attendanceService.checkOut(userId);
        return ResponseEntity.ok(ApiResponse.success("Checked out successfully", result));
    }

    @GetMapping("/check-ins")
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader') or hasAuthority('attendance.view')")
    public ResponseEntity<ApiResponse<List<AttendanceRecordResponse>>> getDailyCheckIns(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<AttendanceRecordResponse> result = attendanceService.getDailyCheckIns(date);
        return ResponseEntity.ok(ApiResponse.success("Daily check-ins retrieved", result));
    }

    @PostMapping("/admin/recheck-in/{userId}")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('attendance.update')")
    public ResponseEntity<ApiResponse<AttendanceRecordResponse>> adminRecheckIn(@PathVariable UUID userId) {
        AttendanceRecordResponse result = attendanceService.adminRecheckIn(userId);
        return ResponseEntity.ok(ApiResponse.success("User re-checked in successfully", result));
    }
}