package com.arrowdatatech.adt_production_report.shift.service;

import com.arrowdatatech.adt_production_report.common.audit.service.ActivityLogService;
import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.shift.dto.*;
import com.arrowdatatech.adt_production_report.shift.entity.Shift;
import com.arrowdatatech.adt_production_report.shift.entity.ShiftUserAssignment;
import com.arrowdatatech.adt_production_report.shift.repository.ShiftRepository;
import com.arrowdatatech.adt_production_report.shift.repository.ShiftUserAssignmentRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.EmployeeProfileRepository;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final ShiftUserAssignmentRepository shiftAssignmentRepository;
    private final UserRepository userRepository;
    private final EmployeeProfileRepository profileRepository;
    private final ActivityLogService activityLogService;

    // ─────────────────────────────────────────────
    // GET ALL SHIFTS (active only)
    // Used by: Add User dropdown, WorkWise shift display
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ShiftResponse> getAllActiveShifts() {
        return shiftRepository.findByIsActiveTrueOrderByName()
                .stream()
                .map(s -> toResponse(s, false))
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET ALL SHIFTS WITH ASSIGNED EMPLOYEES
    // Used by: Shift Management admin page table
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ShiftResponse> getAllShiftsWithEmployees() {
        return shiftRepository.findAll()
                .stream()
                .sorted((a, b) -> a.getName().compareTo(b.getName()))
                .map(s -> toResponse(s, true))
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET SHIFT BY ID
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ShiftResponse getShiftById(UUID id) {
        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Shift", "id", id));
        return toResponse(shift, true);
    }

    // ─────────────────────────────────────────────
    // CREATE SHIFT
    // ─────────────────────────────────────────────
    @Transactional
    public ShiftResponse createShift(CreateShiftRequest request) {

        // Allow duplicate names if they have different times
        // (1st Shift morning, 1st Shift night) - business allows this
        Shift shift = Shift.builder()
                .name(request.getName().trim())
                .startTime(parseTime(request.getStartTime()))
                .endTime(parseTime(request.getEndTime()))
                .description(request.getDescription())
                .isActive(request.getIsActive() != null
                        ? request.getIsActive() : true)
//                .updatedAt(OffsetDateTime.now())
                .build();

        shift = shiftRepository.save(shift);

        logAction("CREATE", shift);
        log.info("Shift created: {}", shift.getName());

        return toResponse(shift, false);
    }

    // ─────────────────────────────────────────────
    // UPDATE SHIFT
    // ─────────────────────────────────────────────
    @Transactional
    public ShiftResponse updateShift(UUID id, CreateShiftRequest request) {

        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Shift", "id", id));

        if (request.getName() != null) {
            shift.setName(request.getName().trim());
        }
        if (request.getStartTime() != null) {
            shift.setStartTime(parseTime(request.getStartTime()));
        }
        if (request.getEndTime() != null) {
            shift.setEndTime(parseTime(request.getEndTime()));
        }
        if (request.getDescription() != null) {
            shift.setDescription(request.getDescription());
        }
        if (request.getIsActive() != null) {
            shift.setIsActive(request.getIsActive());
        }

        shift.setUpdatedAt(OffsetDateTime.now());
        shift = shiftRepository.save(shift);

        logAction("UPDATE", shift);
        log.info("Shift updated: {}", shift.getName());

        return toResponse(shift, true);
    }

    // ─────────────────────────────────────────────
    // DELETE SHIFT
    // ─────────────────────────────────────────────
    @Transactional
    public void deleteShift(UUID id) {
        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Shift", "id", id));

        // Check active assignments
        boolean hasActiveAssignments = shiftAssignmentRepository
                .existsByShiftIdAndEffectiveToIsNull(id);

        if (hasActiveAssignments) {
            // Deactivate instead of delete
            shift.setIsActive(false);
            shift.setUpdatedAt(OffsetDateTime.now());
            shiftRepository.save(shift);
            log.info("Shift deactivated (has active assignments): {}",
                    shift.getName());
        } else {
            shiftRepository.deleteById(id);
            log.info("Shift hard deleted: {}", shift.getName());
        }

        logAction("DELETE", shift);
    }

    // ─────────────────────────────────────────────
    // ASSIGN EMPLOYEES TO SHIFT (Allotment Board)
    // Called when admin clicks "Assign Shift" button
    // ─────────────────────────────────────────────
    @Transactional
    public ShiftAssignmentResponse assignEmployeesToShift(
            UUID shiftId, AssignShiftRequest request) {

        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Shift", "id", shiftId));

        if (!shift.getIsActive()) {
            throw new BadRequestException(
                    "Cannot assign employees to inactive shift.");
        }

        User currentUser = getCurrentUserOrNull();
        int assigned = 0;

        for (UUID userId : request.getUserIds()) {
            User user = userRepository.findByIdWithProfile(userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User", "id", userId));

            // Close current shift assignment for this user
            shiftAssignmentRepository.closeCurrentShift(
                    userId, LocalDate.now());

            // Create new assignment
            ShiftUserAssignment assignment = ShiftUserAssignment.builder()
                    .shift(shift)
                    .user(user)
                    .assignedBy(currentUser)
                    .effectiveFrom(LocalDate.now())
                    .build();

            shiftAssignmentRepository.save(assignment);
            assigned++;

            log.info("Employee {} assigned to shift {}",
                    userId, shift.getName());
        }

        logAction("UPDATE", shift);

        return ShiftAssignmentResponse.builder()
                .shiftId(shiftId)
                .shiftName(shift.getName())
                .assignedCount(assigned)
                .message(assigned + " employee(s) assigned to "
                        + shift.getName() + " successfully.")
                .build();
    }

    // ─────────────────────────────────────────────
    // GET EMPLOYEES FOR SHIFT (Allotment Board display)
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ShiftEmployeeResponse> getEmployeesForShift(UUID shiftId) {
        return shiftAssignmentRepository
                .findByShiftIdAndEffectiveToIsNull(shiftId)
                .stream()
                .filter(a -> a != null && a.getUser() != null)
                .map(a -> {
                    String fullName = a.getUser().getEmployeeProfile() != null
                            ? a.getUser().getEmployeeProfile().getFullName()
                            : a.getUser().getEmail();
                    return ShiftEmployeeResponse.builder()
                            .userId(a.getUser().getId())
                            .fullName(fullName)
                            .email(a.getUser().getEmail())
                            .effectiveFrom(a.getEffectiveFrom())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET ALL EMPLOYEES (for allotment board dropdown)
    // Returns all active employees with their current shift
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<AllEmployeeForShiftResponse> getAllEmployeesWithShiftInfo() {
        List<User> activeUsers = userRepository
                .findByIsActiveTrueAndDeletedAtIsNull();

        return activeUsers.stream()
                .map(user -> {
                    String fullName = user.getEmployeeProfile() != null
                            ? user.getEmployeeProfile().getFullName()
                            : user.getEmail();

                    // Get current shift
                    String currentShiftName = shiftAssignmentRepository
                            .findByUserIdAndEffectiveToIsNull(user.getId())
                            .map(a -> a.getShift().getName())
                            .orElse(null);

                    UUID currentShiftId = shiftAssignmentRepository
                            .findByUserIdAndEffectiveToIsNull(user.getId())
                            .map(a -> a.getShift().getId())
                            .orElse(null);

                    return AllEmployeeForShiftResponse.builder()
                            .userId(user.getId())
                            .fullName(fullName)
                            .email(user.getEmail())
                            .currentShiftId(currentShiftId)
                            .currentShiftName(currentShiftName)
                            .build();
                })
                .sorted((a, b) -> a.getFullName()
                        .compareTo(b.getFullName()))
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // REMOVE EMPLOYEE FROM SHIFT
    // ─────────────────────────────────────────────
    @Transactional
    public void removeEmployeeFromShift(UUID shiftId, UUID userId) {
        shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Shift", "id", shiftId));

        shiftAssignmentRepository.closeCurrentShift(userId, LocalDate.now());
        log.info("Employee {} removed from shift {}", userId, shiftId);
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────

    private LocalTime parseTime(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) return null;
        try {
            return LocalTime.parse(timeStr);
        } catch (Exception e) {
            return null;
        }
    }

    private void logAction(String action, Shift shift) {
        try {
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            userRepository.findByIdWithProfile(currentUserId)
                    .ifPresent(user -> activityLogService.log(
                            user, action, "shift",
                            shift.getId(), shift.getName(), null));
        } catch (Exception e) {
            log.warn("Could not log activity: {}", e.getMessage());
        }
    }

    private User getCurrentUserOrNull() {
        try {
            UUID id = SecurityUtils.getCurrentUserId();
            return userRepository.findByIdWithProfile(id).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private ShiftResponse toResponse(Shift shift, boolean includeEmployees) {
        List<ShiftEmployeeResponse> employees = null;

        if (includeEmployees) {
            employees = shiftAssignmentRepository
                    .findByShiftIdAndEffectiveToIsNull(shift.getId())
                    .stream()
                    .filter(a -> a != null && a.getUser() != null)
                    .map(a -> {
                        String fullName =
                                a.getUser().getEmployeeProfile() != null
                                        ? a.getUser().getEmployeeProfile()
                                        .getFullName()
                                        : a.getUser().getEmail();
                        return ShiftEmployeeResponse.builder()
                                .userId(a.getUser().getId())
                                .fullName(fullName)
                                .email(a.getUser().getEmail())
                                .effectiveFrom(a.getEffectiveFrom())
                                .build();
                    })
                    .collect(Collectors.toList());
        }

        return ShiftResponse.builder()
                .id(shift.getId())
                .name(shift.getName())
                .startTime(shift.getStartTime() != null
                        ? shift.getStartTime().toString() : null)
                .endTime(shift.getEndTime() != null
                        ? shift.getEndTime().toString() : null)
                .description(shift.getDescription())
                .isActive(shift.getIsActive())
                .createdAt(shift.getCreatedAt())
                .assignedEmployees(employees)
                .build();
    }
}