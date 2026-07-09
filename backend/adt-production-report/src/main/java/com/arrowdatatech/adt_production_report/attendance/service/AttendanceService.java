package com.arrowdatatech.adt_production_report.attendance.service;

import com.arrowdatatech.adt_production_report.attendance.dto.*;
import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceEmployee;
import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceRecord;
import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceSalaryDetail;
import com.arrowdatatech.adt_production_report.attendance.repository.*;
import com.arrowdatatech.adt_production_report.role.repository.UserRoleAssignmentRepository;
import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceEmployeeRepository employeeRepository;
    private final AttendanceRecordRepository   recordRepository;
    private final AttendanceSalaryDetailRepository salaryRepository;
    private final UserRoleAssignmentRepository roleAssignmentRepository;
    private final UserRepository userRepository;

    // ─────────────────────────────────────────────
    // GET ALL EMPLOYEES (active)
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<AttendanceEmployeeResponse> getEmployees(
            String category, String name) {
        return employeeRepository
                .searchEmployees(
                        (category != null && !category.isBlank())
                                ? category : null,
                        (name != null && !name.isBlank())
                                ? name : null)
                .stream()
                .map(this::toEmployeeResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // CREATE EMPLOYEE
    // ─────────────────────────────────────────────
    @Transactional
    public AttendanceEmployeeResponse createEmployee(
            CreateAttendanceEmployeeRequest request) {

        if (request.getName() == null || request.getName().isBlank()) {
            throw new BadRequestException("Employee name is required.");
        }

        int sortOrder = (int) employeeRepository.count() + 1;

        AttendanceEmployee emp = AttendanceEmployee.builder()
                .name(request.getName().trim())
                .category(request.getCategory() != null
                        ? request.getCategory() : "Operator")
                .gpayNumber(request.getGpayNumber())
                .baseSalary(request.getBaseSalary() != null
                        ? request.getBaseSalary()
                        : new BigDecimal("5000.00"))
                .isActive(true)
                .sortOrder(sortOrder)
                .updatedAt(OffsetDateTime.now())
                .build();

        emp = employeeRepository.save(emp);
        log.info("Attendance employee created: {}", emp.getName());
        return toEmployeeResponse(emp);
    }

    // ─────────────────────────────────────────────
    // UPDATE EMPLOYEE
    // ─────────────────────────────────────────────
    @Transactional
    public AttendanceEmployeeResponse updateEmployee(
            UUID id, CreateAttendanceEmployeeRequest request) {

        AttendanceEmployee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "AttendanceEmployee", "id", id));

        if (request.getName() != null && !request.getName().isBlank()) {
            emp.setName(request.getName().trim());
        }
        if (request.getCategory() != null) {
            emp.setCategory(request.getCategory());
        }
        if (request.getGpayNumber() != null) {
            emp.setGpayNumber(request.getGpayNumber());
        }
        if (request.getBaseSalary() != null) {
            emp.setBaseSalary(request.getBaseSalary());
        }
        emp.setUpdatedAt(OffsetDateTime.now());
        employeeRepository.save(emp);
        return toEmployeeResponse(emp);
    }

    // ─────────────────────────────────────────────
    // DELETE EMPLOYEE (soft delete)
    // ─────────────────────────────────────────────
    @Transactional
    public void deleteEmployee(UUID id) {
        AttendanceEmployee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "AttendanceEmployee", "id", id));
        emp.setIsActive(false);
        emp.setUpdatedAt(OffsetDateTime.now());
        employeeRepository.save(emp);
        log.info("Attendance employee soft-deleted: {}", emp.getName());
    }

    // ─────────────────────────────────────────────
    // GET MONTHLY ATTENDANCE
    // Returns all employees + their attendance records
    // for the requested month + salary details
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public MonthlyAttendanceResponse getMonthlyAttendance(
            int year, int month) {

        List<AttendanceEmployee> employees =
                employeeRepository
                        .findByIsActiveTrueOrderBySortOrderAscNameAsc();

        // Date range for the month
        LocalDate start = LocalDate.of(year, month + 1, 1);
        LocalDate end   = start.withDayOfMonth(
                start.lengthOfMonth());

        // All records for this month
        List<AttendanceRecord> records =
                recordRepository.findByAttendanceDateBetween(start, end);

        // Build map: employeeId -> (day -> status)
        Map<UUID, Map<Integer, String>> attendanceMap = new HashMap<>();
        employees.forEach(e -> attendanceMap.put(e.getId(), new HashMap<>()));

        records.forEach(r -> {
            UUID empId = r.getEmployee().getId();
            int  day   = r.getAttendanceDate().getDayOfMonth();
            if (attendanceMap.containsKey(empId)) {
                attendanceMap.get(empId).put(day, r.getStatus());
            }
        });

        // Auto-fill Sundays as PH, and past days as 'A' if not explicitly marked
        LocalDate today = LocalDate.now();
        int daysInMonth = start.lengthOfMonth();
        for (int d = 1; d <= daysInMonth; d++) {
            LocalDate date = LocalDate.of(year, month + 1, d);
            boolean isSunday = date.getDayOfWeek().getValue() == 7;
            int finalD = d;

            if (isSunday) {
                attendanceMap.forEach((empId, dayMap) -> {
                    String status = dayMap.get(finalD);
                    if (status == null || status.isBlank() || "A".equals(status)) {
                        dayMap.put(finalD, "PH");
                    }
                });
            } else if (date.isBefore(today)) {
                attendanceMap.forEach((empId, dayMap) -> {
                    String status = dayMap.get(finalD);
                    if (status == null || status.isBlank()) {
                        dayMap.put(finalD, "A");
                    }
                });
            }
        }

        // Load salary details
        List<AttendanceSalaryDetail> salaries = salaryRepository
                .findByYearAndMonth((short) year, (short) month);

        Map<UUID, SalaryDetailDto> salaryMap = new HashMap<>();
        salaries.forEach(s -> salaryMap.put(
                s.getEmployee().getId(),
                SalaryDetailDto.builder()
                        .baseSalary(s.getBaseSalary())
                        .incentive(s.getIncentive())
                        .advance(s.getAdvance())
                        .salaryStatus(s.getSalaryStatus())
                        .isHidden(s.getIsHidden())
                        .build()
        ));

        List<AttendanceEmployeeResponse> empResponses = employees.stream()
                .map(this::toEmployeeResponse)
                .collect(Collectors.toList());

        return MonthlyAttendanceResponse.builder()
                .year(year)
                .month(month)
                .employees(empResponses)
                .attendance(attendanceMap)
                .salaryDetails(salaryMap)
                .build();
    }

    // ─────────────────────────────────────────────
    // CLEAR MONTHLY ATTENDANCE (delete records & salary details)
    // ─────────────────────────────────────────────
    @Transactional
    public void clearMonthlyAttendance(int year, int month) {
        log.info("Admin clearing all attendance records and salary details for year: {}, month: {}", year, month);

        LocalDate start = LocalDate.of(year, month + 1, 1);
        LocalDate end   = start.withDayOfMonth(start.lengthOfMonth());

        // 1. Delete all AttendanceRecord records for this month
        recordRepository.deleteByAttendanceDateBetween(start, end);

        // 2. Delete all AttendanceSalaryDetail records for this month
        salaryRepository.deleteByYearAndMonth((short) year, (short) month);
    }

    // ─────────────────────────────────────────────
    // SAVE MONTHLY ATTENDANCE (bulk upsert)
    // Called when user navigates away or clicks Save
    // ─────────────────────────────────────────────
    @Transactional
    public void saveMonthlyAttendance(BulkAttendanceRequest request) {
        int year  = request.getYear();
        int month = request.getMonth();

        LocalDate start = LocalDate.of(year, month + 1, 1);
        LocalDate end   = start.withDayOfMonth(start.lengthOfMonth());

        // Load all existing records for this month
        List<AttendanceRecord> existing =
                recordRepository.findByAttendanceDateBetween(start, end);

        Map<String, AttendanceRecord> existingMap = existing.stream()
                .filter(r -> r != null && r.getEmployee() != null)
                .collect(Collectors.toMap(
                        r -> r.getEmployee().getId() + "_" + r.getAttendanceDate(),
                        r -> r
                ));

        if (request.getAttendance() == null) return;

        request.getAttendance().forEach((empId, dayMap) -> {
            AttendanceEmployee emp = employeeRepository
                    .findById(empId).orElse(null);
            if (emp == null) return;

            dayMap.forEach((day, status) -> {
                LocalDate date = LocalDate.of(year, month + 1, day);
                String key = empId + "_" + date;

                AttendanceRecord record = existingMap.get(key);
                if (record == null) {
                    if (status == null || status.isEmpty()) return;
                    record = AttendanceRecord.builder()
                            .employee(emp)
                            .attendanceDate(date)
                            .status(status)
                            .updatedAt(OffsetDateTime.now())
                            .build();
                } else {
                    record.setStatus(status != null ? status : "");
                    record.setUpdatedAt(OffsetDateTime.now());
                }
                recordRepository.save(record);
            });
        });

        log.info("Bulk attendance saved for {}/{}, {} employees",
                month + 1, year,
                request.getAttendance().size());
    }

    // ─────────────────────────────────────────────
    // UPDATE SINGLE CELL — real-time cell update
    // Called on every cell click for instant persistence
    // ─────────────────────────────────────────────
    @Transactional
    public void updateSingleCell(UUID employeeId,
                                 LocalDate date,
                                 String status) {

        AttendanceEmployee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "AttendanceEmployee", "id", employeeId));

        AttendanceRecord record = recordRepository
                .findByEmployeeIdAndAttendanceDate(employeeId, date)
                .orElse(null);

        if (record == null) {
            record = AttendanceRecord.builder()
                    .employee(emp)
                    .attendanceDate(date)
                    .status(status != null ? status : "")
                    .updatedAt(OffsetDateTime.now())
                    .build();
        } else {
            record.setStatus(status != null ? status : "");
            record.setUpdatedAt(OffsetDateTime.now());
        }
        recordRepository.save(record);
    }

    // ─────────────────────────────────────────────
    // QUICK MARK DAY — mark all employees for one day
    // ─────────────────────────────────────────────
    @Transactional
    public void quickMarkDay(int year, int month,
                             int day, String status) {

        LocalDate date = LocalDate.of(year, month + 1, day);
        List<AttendanceEmployee> employees =
                employeeRepository
                        .findByIsActiveTrueOrderBySortOrderAscNameAsc();

        employees.forEach(emp -> {
            AttendanceRecord record = recordRepository
                    .findByEmployeeIdAndAttendanceDate(emp.getId(), date)
                    .orElse(null);

            if (record == null) {
                record = AttendanceRecord.builder()
                        .employee(emp)
                        .attendanceDate(date)
                        .status(status)
                        .updatedAt(OffsetDateTime.now())
                        .build();
            } else {
                record.setStatus(status);
                record.setUpdatedAt(OffsetDateTime.now());
            }
            recordRepository.save(record);
        });

        log.info("Quick mark: {} employees marked '{}' for {}",
                employees.size(), status, date);
    }

    // ─────────────────────────────────────────────
    // UPDATE SALARY DETAIL (upsert)
    // ─────────────────────────────────────────────
    @Transactional
    public SalaryDetailDto updateSalaryDetail(
            UpdateSalaryDetailRequest request) {

        AttendanceEmployee emp = employeeRepository
                .findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "AttendanceEmployee", "id",
                        request.getEmployeeId()));

        short year  = request.getYear().shortValue();
        short month = request.getMonth().shortValue();

        AttendanceSalaryDetail detail = salaryRepository
                .findByEmployeeIdAndYearAndMonth(emp.getId(), year, month)
                .orElse(null);

        if (detail == null) {
            detail = AttendanceSalaryDetail.builder()
                    .employee(emp)
                    .year(year)
                    .month(month)
                    .incentive(BigDecimal.ZERO)
                    .advance(BigDecimal.ZERO)
                    .salaryStatus("pending")
                    .isHidden(false)
                    .updatedAt(OffsetDateTime.now())
                    .build();
        }

        if (request.getBaseSalary() != null) {
            detail.setBaseSalary(request.getBaseSalary());
        }
        if (request.getIncentive() != null) {
            detail.setIncentive(request.getIncentive());
        }
        if (request.getAdvance() != null) {
            detail.setAdvance(request.getAdvance());
        }
        if (request.getSalaryStatus() != null) {
            detail.setSalaryStatus(request.getSalaryStatus());
        }
        if (request.getIsHidden() != null) {
            detail.setIsHidden(request.getIsHidden());
        }
        detail.setUpdatedAt(OffsetDateTime.now());
        detail = salaryRepository.save(detail);

        return SalaryDetailDto.builder()
                .baseSalary(detail.getBaseSalary())
                .incentive(detail.getIncentive())
                .advance(detail.getAdvance())
                .salaryStatus(detail.getSalaryStatus())
                .isHidden(detail.getIsHidden())
                .build();
    }

    // ─────────────────────────────────────────────
    // MANUAL CHECK-IN / CHECK-OUT METHODS
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AttendanceRecordResponse getTodayRecord(UUID userId) {
        AttendanceEmployee emp = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceEmployee", "userId", userId));

        AttendanceRecord record = recordRepository
                .findByEmployeeIdAndAttendanceDate(emp.getId(), LocalDate.now())
                .orElse(null);

        return toRecordResponse(emp, record);
    }

    @Transactional
    public AttendanceRecordResponse checkIn(UUID userId) {
        AttendanceEmployee emp = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceEmployee", "userId", userId));

        LocalDate today = LocalDate.now();
        AttendanceRecord record = recordRepository
                .findByEmployeeIdAndAttendanceDate(emp.getId(), today)
                .orElse(null);

        if (record == null) {
            record = AttendanceRecord.builder()
                    .employee(emp)
                    .attendanceDate(today)
                    .status("P")
                    .checkInTime(OffsetDateTime.now())
                    .updatedAt(OffsetDateTime.now())
                    .build();
        } else {
            if (record.getCheckInTime() != null) {
                throw new BadRequestException("You have already checked in today at " + record.getCheckInTime());
            }
            record.setCheckInTime(OffsetDateTime.now());
            record.setStatus("P");
            record.setUpdatedAt(OffsetDateTime.now());
        }

        record = recordRepository.save(record);
        return toRecordResponse(emp, record);
    }

    @Transactional
    public AttendanceRecordResponse checkOut(UUID userId) {
        AttendanceEmployee emp = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceEmployee", "userId", userId));

        LocalDate today = LocalDate.now();
        AttendanceRecord record = recordRepository
                .findByEmployeeIdAndAttendanceDate(emp.getId(), today)
                .orElseThrow(() -> new BadRequestException("You must check in first before checking out."));

        if (record.getCheckInTime() == null) {
            throw new BadRequestException("You must check in first before checking out.");
        }
        if (record.getCheckOutTime() != null) {
            throw new BadRequestException("You have already checked out today at " + record.getCheckOutTime());
        }

        record.setCheckOutTime(OffsetDateTime.now());
        record.setUpdatedAt(OffsetDateTime.now());
        record = recordRepository.save(record);
        return toRecordResponse(emp, record);
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getDailyCheckIns(LocalDate date) {
        List<AttendanceEmployee> employees = employeeRepository.findByIsActiveTrueOrderBySortOrderAscNameAsc();
        List<AttendanceRecord> records = recordRepository.findByAttendanceDateBetween(date, date);

        Map<UUID, AttendanceRecord> recordMap = records.stream()
                .filter(r -> r != null && r.getEmployee() != null)
                .collect(Collectors.toMap(r -> r.getEmployee().getId(), r -> r));

        return employees.stream()
                .map(emp -> toRecordResponse(emp, recordMap.get(emp.getId())))
                .collect(Collectors.toList());
    }

    private AttendanceRecordResponse toRecordResponse(AttendanceEmployee emp, AttendanceRecord record) {
        if (record == null) {
            return AttendanceRecordResponse.builder()
                    .employeeId(emp.getId())
                    .userId(emp.getUserId())
                    .employeeName(emp.getName())
                    .attendanceDate(LocalDate.now())
                    .status("")
                    .build();
        }
        return AttendanceRecordResponse.builder()
                .id(record.getId())
                .employeeId(emp.getId())
                .userId(emp.getUserId())
                .employeeName(emp.getName())
                .attendanceDate(record.getAttendanceDate())
                .status(record.getStatus())
                .checkInTime(record.getCheckInTime())
                .checkOutTime(record.getCheckOutTime())
                .build();
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────

    private String getEmployeeRoleName(AttendanceEmployee e) {
        if (e.getUserId() != null) {
            List<String> roles = roleAssignmentRepository.findRoleNamesByUserId(e.getUserId());
            if (!roles.isEmpty()) {
                return roles.get(0);
            }
        }
        return e.getCategory();
    }

    private String getEmployeeUserCode(AttendanceEmployee e) {
        if (e.getUserId() != null) {
            return userRepository.findById(e.getUserId())
                    .map(User::getUserCode)
                    .orElse("—");
        }
        return "—";
    }

    private AttendanceEmployeeResponse toEmployeeResponse(
            AttendanceEmployee e) {
        return AttendanceEmployeeResponse.builder()
                .id(e.getId())
                .userCode(getEmployeeUserCode(e))
                .name(e.getName())
                .category(getEmployeeRoleName(e))
                .gpayNumber(e.getGpayNumber())
                .baseSalary(e.getBaseSalary())
                .sortOrder(e.getSortOrder())
                .build();
    }
}