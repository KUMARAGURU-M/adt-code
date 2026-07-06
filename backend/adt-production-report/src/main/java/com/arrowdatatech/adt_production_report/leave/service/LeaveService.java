package com.arrowdatatech.adt_production_report.leave.service;

import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.leave.dto.*;
import com.arrowdatatech.adt_production_report.leave.entity.*;
import com.arrowdatatech.adt_production_report.leave.repository.*;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceEmployee;
import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceRecord;
import com.arrowdatatech.adt_production_report.attendance.repository.AttendanceEmployeeRepository;
import com.arrowdatatech.adt_production_report.attendance.repository.AttendanceRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveTypeRepository    leaveTypeRepo;
    private final LeavePolicyRepository  leavePolicyRepo;
    private final LeaveRequestRepository leaveRequestRepo;
    private final LeaveBalanceRepository leaveBalanceRepo;
    private final UserRepository         userRepo;
    private final AttendanceEmployeeRepository attendanceEmployeeRepo;
    private final AttendanceRecordRepository   attendanceRecordRepo;

    // ─────────────────────────────────────────────
    // LEAVE TYPES
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LeaveTypeDto> getAllLeaveTypes() {
        return leaveTypeRepo.findByIsActiveTrueOrderByNameAsc()
                .stream().map(this::toTypeDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeaveTypeDto createLeaveType(CreateLeaveTypeRequest req) {
        if (req.getCode() == null || req.getCode().isBlank())
            throw new BadRequestException("Code is required.");
        if (req.getName() == null || req.getName().isBlank())
            throw new BadRequestException("Name is required.");
        if (leaveTypeRepo.existsByCodeAndIsActiveTrue(
                req.getCode().toUpperCase()))
            throw new BadRequestException(
                    "Leave type code '" + req.getCode() + "' already exists.");

        LeaveType lt = LeaveType.builder()
                .code(req.getCode().toUpperCase().trim())
                .name(req.getName().trim())
                .description(req.getDescription())
                .maxDaysPerYear(req.getMaxDaysPerYear())
                .carryForward(Boolean.TRUE.equals(req.getCarryForward()))
                .requiresApproval(
                        req.getRequiresApproval() == null
                                || req.getRequiresApproval())
                .isActive(true)
                .updatedAt(OffsetDateTime.now())
                .build();
        return toTypeDto(leaveTypeRepo.save(lt));
    }

    @Transactional
    public LeaveTypeDto updateLeaveType(UUID id, CreateLeaveTypeRequest req) {
        LeaveType lt = leaveTypeRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "LeaveType", "id", id));
        if (req.getName() != null && !req.getName().isBlank())
            lt.setName(req.getName().trim());
        if (req.getDescription() != null)
            lt.setDescription(req.getDescription());
        if (req.getMaxDaysPerYear() != null)
            lt.setMaxDaysPerYear(req.getMaxDaysPerYear());
        if (req.getCarryForward() != null)
            lt.setCarryForward(req.getCarryForward());
        if (req.getRequiresApproval() != null)
            lt.setRequiresApproval(req.getRequiresApproval());
        lt.setUpdatedAt(OffsetDateTime.now());
        return toTypeDto(leaveTypeRepo.save(lt));
    }

    @Transactional
    public void deleteLeaveType(UUID id) {
        LeaveType lt = leaveTypeRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "LeaveType", "id", id));
        lt.setIsActive(false);
        lt.setUpdatedAt(OffsetDateTime.now());
        leaveTypeRepo.save(lt);
    }

    // ─────────────────────────────────────────────
    // LEAVE POLICIES
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LeavePolicyDto> getAllPolicies() {
        return leavePolicyRepo.findByIsActiveTrueOrderByNameAsc()
                .stream().map(this::toPolicyDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeavePolicyDto createPolicy(CreateLeavePolicyRequest req) {
        if (req.getName() == null || req.getName().isBlank())
            throw new BadRequestException("Policy name is required.");

        LeavePolicy p = LeavePolicy.builder()
                .name(req.getName().trim())
                .description(req.getDescription())
                .defaultAnnualDays(
                        req.getDefaultAnnualDays() != null
                                ? req.getDefaultAnnualDays() : 12)
                .probationDays(
                        req.getProbationDays() != null
                                ? req.getProbationDays() : 0)
                .yearStartMonth(
                        req.getYearStartMonth() != null
                                ? req.getYearStartMonth() : "January")
                .yearStartDay(
                        req.getYearStartDay() != null
                                ? req.getYearStartDay() : 1)
                .isActive(true)
                .updatedAt(OffsetDateTime.now())
                .build();
        return toPolicyDto(leavePolicyRepo.save(p));
    }

    @Transactional
    public LeavePolicyDto updatePolicy(UUID id, CreateLeavePolicyRequest req) {
        LeavePolicy p = leavePolicyRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "LeavePolicy", "id", id));
        if (req.getName() != null && !req.getName().isBlank())
            p.setName(req.getName().trim());
        if (req.getDescription() != null)
            p.setDescription(req.getDescription());
        if (req.getDefaultAnnualDays() != null)
            p.setDefaultAnnualDays(req.getDefaultAnnualDays());
        if (req.getProbationDays() != null)
            p.setProbationDays(req.getProbationDays());
        if (req.getYearStartMonth() != null)
            p.setYearStartMonth(req.getYearStartMonth());
        if (req.getYearStartDay() != null)
            p.setYearStartDay(req.getYearStartDay());
        p.setUpdatedAt(OffsetDateTime.now());
        return toPolicyDto(leavePolicyRepo.save(p));
    }

    @Transactional
    public void deletePolicy(UUID id) {
        LeavePolicy p = leavePolicyRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "LeavePolicy", "id", id));
        p.setIsActive(false);
        p.setUpdatedAt(OffsetDateTime.now());
        leavePolicyRepo.save(p);
    }

    // ─────────────────────────────────────────────
    // LEAVE REQUESTS — Admin
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<LeaveRequestDto> searchRequests(
            UUID userId, String status, UUID leaveTypeId,
            int page, int size) {

        Pageable pg = PageRequest.of(page, size);
        return leaveRequestRepo
                .searchRequests(userId, status, leaveTypeId, pg)
                .map(this::toRequestDto);
    }

    @Transactional
    public LeaveRequestDto createRequest(CreateLeaveRequestRequest req) {

        if (req.getUserId() == null)
            throw new BadRequestException("User is required.");
        if (req.getLeaveTypeId() == null)
            throw new BadRequestException("Leave type is required.");
        if (req.getStartDate() == null || req.getEndDate() == null)
            throw new BadRequestException("Start and end dates are required.");
        if (req.getEndDate().isBefore(req.getStartDate()))
            throw new BadRequestException("End date must be after start date.");

        User user = userRepo.findByIdWithProfile(req.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User", "id", req.getUserId()));

        LeaveType lt = leaveTypeRepo.findById(req.getLeaveTypeId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "LeaveType", "id", req.getLeaveTypeId()));

        User approver = null;
        if (req.getApproverId() != null) {
            approver = userRepo.findByIdWithProfile(req.getApproverId())
                    .orElse(null);
        }

        long diff = ChronoUnit.DAYS.between(
                req.getStartDate(), req.getEndDate()) + 1;
        BigDecimal days = new BigDecimal(diff);

        // Check overlap
        if (leaveRequestRepo.hasOverlap(
                user.getId(), req.getStartDate(), req.getEndDate())) {
            throw new BadRequestException(
                    "Employee already has a leave request for overlapping dates.");
        }

        String status = req.getStatus() != null
                && !req.getStatus().isBlank()
                ? req.getStatus() : "Pending";

        LeaveRequest lr = LeaveRequest.builder()
                .user(user)
                .leaveType(lt)
                .approver(approver)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .days(days)
                .reason(req.getReason())
                .status(status)
                .adminNote(req.getAdminNote())
                .appliedAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        lr = leaveRequestRepo.save(lr);

        // Update balance pending count
        updateBalancePending(user, lt,
                (short) req.getStartDate().getYear(), days, true);

        if ("Approved".equals(status)) {
            updateAttendanceForApprovedLeave(lr);
        }

        log.info("Leave request created for user {} — {} days {}",
                user.getId(), days, lt.getCode());
        return toRequestDto(lr);
    }

    @Transactional
    public LeaveRequestDto updateRequest(UUID id,
                                         CreateLeaveRequestRequest req) {
        LeaveRequest lr = leaveRequestRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "LeaveRequest", "id", id));

        String prevStatus = lr.getStatus();

        if (req.getLeaveTypeId() != null) {
            LeaveType lt = leaveTypeRepo.findById(req.getLeaveTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "LeaveType", "id", req.getLeaveTypeId()));
            lr.setLeaveType(lt);
        }
        if (req.getApproverId() != null) {
            userRepo.findByIdWithProfile(req.getApproverId())
                    .ifPresent(lr::setApprover);
        }
        if (req.getStartDate() != null) lr.setStartDate(req.getStartDate());
        if (req.getEndDate()   != null) lr.setEndDate(req.getEndDate());
        if (req.getReason()    != null) lr.setReason(req.getReason());
        if (req.getStatus()    != null) lr.setStatus(req.getStatus());
        if (req.getAdminNote() != null) lr.setAdminNote(req.getAdminNote());

        if (req.getStartDate() != null && req.getEndDate() != null) {
            long diff = ChronoUnit.DAYS.between(
                    req.getStartDate(), req.getEndDate()) + 1;
            lr.setDays(new BigDecimal(diff));
        }

        lr.setUpdatedAt(OffsetDateTime.now());
        lr = leaveRequestRepo.save(lr);
        syncAttendanceOnStatusChange(lr, prevStatus, lr.getStatus());
        return toRequestDto(lr);
    }

    // Admin review (Approve / Reject)
    @Transactional
    public LeaveRequestDto reviewRequest(UUID id, ReviewLeaveRequest req) {
        LeaveRequest lr = leaveRequestRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "LeaveRequest", "id", id));

        UUID reviewerId = SecurityUtils.getCurrentUserId();
        if (lr.getUser() != null && lr.getUser().getId().equals(reviewerId) && !SecurityUtils.hasRole("Admin")) {
            throw new BadRequestException("You cannot approve your own leave request.");
        }

        boolean isRequesterManager = lr.getUser() != null && lr.getUser().getRoleAssignments().stream()
                .anyMatch(ra -> "Manager".equals(ra.getRole().getName()));
        if (isRequesterManager && !SecurityUtils.hasRole("Admin")) {
            throw new BadRequestException("Only an Admin can approve leave requests from a Manager.");
        }

        String prevStatus = lr.getStatus();
        lr.setStatus(req.getStatus());
        lr.setAdminNote(req.getAdminNote());
        lr.setReviewedAt(OffsetDateTime.now());
        lr.setUpdatedAt(OffsetDateTime.now());

        // Try to get current reviewer
        try {
            userRepo.findByIdWithProfile(reviewerId)
                    .ifPresent(lr::setReviewedBy);
        } catch (Exception ignored) {}

        leaveRequestRepo.save(lr);

        syncAttendanceOnStatusChange(lr, prevStatus, lr.getStatus());

        // Adjust balance
        short year = (short) lr.getStartDate().getYear();
        if ("Approved".equals(req.getStatus())
                && "Pending".equals(prevStatus)) {
            // Move from pending → used
            updateBalancePending(lr.getUser(), lr.getLeaveType(),
                    year, lr.getDays(), false);
            updateBalanceUsed(lr.getUser(), lr.getLeaveType(),
                    year, lr.getDays(), true);
        } else if (("Rejected".equals(req.getStatus())
                || "Cancelled".equals(req.getStatus()))
                && "Pending".equals(prevStatus)) {
            // Remove from pending
            updateBalancePending(lr.getUser(), lr.getLeaveType(),
                    year, lr.getDays(), false);
        }

        log.info("Leave request {} reviewed: {}", id, req.getStatus());
        return toRequestDto(lr);
    }

    @Transactional
    public void deleteRequest(UUID id) {
        LeaveRequest lr = leaveRequestRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "LeaveRequest", "id", id));
        // Reverse pending balance
        if ("Pending".equals(lr.getStatus())) {
            short year = (short) lr.getStartDate().getYear();
            updateBalancePending(lr.getUser(), lr.getLeaveType(),
                    year, lr.getDays(), false);
        }
        if ("Approved".equals(lr.getStatus())) {
            revertAttendanceForCancelledLeave(lr);
        }
        leaveRequestRepo.deleteById(id);
    }

    // ─────────────────────────────────────────────
    // LEAVE REQUESTS — Employee self-service
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LeaveRequestDto> getMyRequests(UUID userId) {
        return leaveRequestRepo
                .findByUserIdOrderByAppliedAtDesc(userId)
                .stream().map(this::toRequestDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeaveRequestDto applyLeave(UUID userId,
                                      CreateLeaveRequestRequest req) {
        req.setUserId(userId);
        return createRequest(req);
    }

    @Transactional
    public LeaveRequestDto cancelMyLeave(UUID userId, UUID requestId) {
        LeaveRequest lr = leaveRequestRepo.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "LeaveRequest", "id", requestId));
        if (!lr.getUser().getId().equals(userId))
            throw new BadRequestException(
                    "Cannot cancel another user's leave request.");
        if (!"Pending".equals(lr.getStatus()))
            throw new BadRequestException(
                    "Only pending requests can be cancelled.");
        lr.setStatus("Cancelled");
        lr.setUpdatedAt(OffsetDateTime.now());
        leaveRequestRepo.save(lr);

        short year = (short) lr.getStartDate().getYear();
        updateBalancePending(lr.getUser(), lr.getLeaveType(),
                year, lr.getDays(), false);

        return toRequestDto(lr);
    }

    // ─────────────────────────────────────────────
    // LEAVE BALANCES
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LeaveBalanceDto> getBalancesForUser(UUID userId, int year) {
        return leaveBalanceRepo
                .findByUserIdAndYearOrderByLeaveTypeNameAsc(
                        userId, (short) year)
                .stream().map(this::toBalanceDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveBalanceDto> getAllBalances(int year) {
        return leaveBalanceRepo
                .findByYearOrderByUserIdAsc((short) year)
                .stream().map(this::toBalanceDto)
                .collect(Collectors.toList());
    }

    // Admin: allocate leave balance for a user
    @Transactional
    public LeaveBalanceDto allocateBalance(UUID userId, UUID leaveTypeId,
                                           int year, BigDecimal days) {
        User user = userRepo.findByIdWithProfile(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User", "id", userId));
        LeaveType lt = leaveTypeRepo.findById(leaveTypeId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "LeaveType", "id", leaveTypeId));

        LeaveBalance lb = leaveBalanceRepo
                .findByUserIdAndLeaveTypeIdAndYear(
                        userId, leaveTypeId, (short) year)
                .orElse(LeaveBalance.builder()
                        .user(user)
                        .leaveType(lt)
                        .year((short) year)
                        .updatedAt(OffsetDateTime.now())
                        .build());

        lb.setTotalAllocated(days);
        lb.setUpdatedAt(OffsetDateTime.now());
        return toBalanceDto(leaveBalanceRepo.save(lb));
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────

    private void updateBalancePending(User user, LeaveType lt,
                                      short year, BigDecimal days,
                                      boolean add) {
        if (user == null) return;
        leaveBalanceRepo
                .findByUserIdAndLeaveTypeIdAndYear(
                        user.getId(), lt.getId(), year)
                .ifPresent(lb -> {
                    BigDecimal current = lb.getPending() != null
                            ? lb.getPending() : BigDecimal.ZERO;
                    lb.setPending(add
                            ? current.add(days)
                            : current.subtract(days).max(BigDecimal.ZERO));
                    lb.setUpdatedAt(OffsetDateTime.now());
                    leaveBalanceRepo.save(lb);
                });
    }

    private void updateBalanceUsed(User user, LeaveType lt,
                                   short year, BigDecimal days,
                                   boolean add) {
        if (user == null) return;
        leaveBalanceRepo
                .findByUserIdAndLeaveTypeIdAndYear(
                        user.getId(), lt.getId(), year)
                .ifPresent(lb -> {
                    BigDecimal current = lb.getUsed() != null
                            ? lb.getUsed() : BigDecimal.ZERO;
                    lb.setUsed(add
                            ? current.add(days)
                            : current.subtract(days).max(BigDecimal.ZERO));
                    lb.setUpdatedAt(OffsetDateTime.now());
                    leaveBalanceRepo.save(lb);
                });
    }

    private String getFullName(User user) {
        if (user == null) return null;
        return user.getEmployeeProfile() != null
                ? user.getEmployeeProfile().getFullName()
                : user.getEmail();
    }

    private LeaveTypeDto toTypeDto(LeaveType lt) {
        return LeaveTypeDto.builder()
                .id(lt.getId()).code(lt.getCode()).name(lt.getName())
                .description(lt.getDescription())
                .maxDaysPerYear(lt.getMaxDaysPerYear())
                .carryForward(lt.getCarryForward())
                .requiresApproval(lt.getRequiresApproval())
                .isActive(lt.getIsActive())
                .createdAt(lt.getCreatedAt())
                .build();
    }

    private LeavePolicyDto toPolicyDto(LeavePolicy p) {
        return LeavePolicyDto.builder()
                .id(p.getId()).name(p.getName())
                .description(p.getDescription())
                .defaultAnnualDays(p.getDefaultAnnualDays())
                .probationDays(p.getProbationDays())
                .yearStartMonth(p.getYearStartMonth())
                .yearStartDay(p.getYearStartDay())
                .isActive(p.getIsActive())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private LeaveRequestDto toRequestDto(LeaveRequest r) {
        return LeaveRequestDto.builder()
                .id(r.getId())
                .userId(r.getUser() != null ? r.getUser().getId() : null)
                .employeeName(getFullName(r.getUser()))
                .leaveTypeId(r.getLeaveType().getId())
                .leaveTypeName(r.getLeaveType().getName())
                .leaveTypeCode(r.getLeaveType().getCode())
                .approverId(r.getApprover() != null
                        ? r.getApprover().getId() : null)
                .approverName(getFullName(r.getApprover()))
                .startDate(r.getStartDate())
                .endDate(r.getEndDate())
                .days(r.getDays())
                .reason(r.getReason())
                .status(r.getStatus())
                .adminNote(r.getAdminNote())
                .appliedAt(r.getAppliedAt())
                .reviewedAt(r.getReviewedAt())
                .build();
    }

    private LeaveBalanceDto toBalanceDto(LeaveBalance lb) {
        return LeaveBalanceDto.builder()
                .id(lb.getId())
                .userId(lb.getUser() != null ? lb.getUser().getId() : null)
                .employeeName(getFullName(lb.getUser()))
                .leaveTypeId(lb.getLeaveType().getId())
                .leaveTypeName(lb.getLeaveType().getName())
                .year(lb.getYear())
                .totalAllocated(lb.getTotalAllocated())
                .used(lb.getUsed())
                .pending(lb.getPending())
                .carriedForward(lb.getCarriedForward())
                .available(lb.getAvailable())
                .build();
    }

    private void updateAttendanceForApprovedLeave(LeaveRequest lr) {
        if (lr.getUser() == null) return;
        attendanceEmployeeRepo.findByUserId(lr.getUser().getId()).ifPresent(emp -> {
            LocalDate current = lr.getStartDate();
            LocalDate end = lr.getEndDate();
            while (!current.isAfter(end)) {
                LocalDate date = current;
                boolean isSunday = date.getDayOfWeek().getValue() == 7;
                String status = isSunday ? "PH" : "A";
                AttendanceRecord record = attendanceRecordRepo
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
                attendanceRecordRepo.save(record);
                current = current.plusDays(1);
            }
        });
    }

    private void revertAttendanceForCancelledLeave(LeaveRequest lr) {
        if (lr.getUser() == null) return;
        attendanceEmployeeRepo.findByUserId(lr.getUser().getId()).ifPresent(emp -> {
            LocalDate current = lr.getStartDate();
            LocalDate end = lr.getEndDate();
            while (!current.isAfter(end)) {
                LocalDate date = current;
                boolean isSunday = date.getDayOfWeek().getValue() == 7;
                attendanceRecordRepo.findByEmployeeIdAndAttendanceDate(emp.getId(), date)
                        .ifPresent(record -> {
                            if (isSunday) {
                                record.setStatus("PH");
                                record.setUpdatedAt(OffsetDateTime.now());
                                attendanceRecordRepo.save(record);
                            } else if ("A".equals(record.getStatus())) {
                                record.setStatus("");
                                record.setUpdatedAt(OffsetDateTime.now());
                                attendanceRecordRepo.save(record);
                            }
                        });
                current = current.plusDays(1);
            }
        });
    }

    private void syncAttendanceOnStatusChange(LeaveRequest lr, String prevStatus, String newStatus) {
        if ("Approved".equals(newStatus) && !"Approved".equals(prevStatus)) {
            updateAttendanceForApprovedLeave(lr);
        } else if (!"Approved".equals(newStatus) && "Approved".equals(prevStatus)) {
            revertAttendanceForCancelledLeave(lr);
        }
    }
}