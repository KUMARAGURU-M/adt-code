package com.arrowdatatech.adt_production_report.user.service;

import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceEmployee;
import com.arrowdatatech.adt_production_report.attendance.repository.AttendanceEmployeeRepository;
import com.arrowdatatech.adt_production_report.auth.repository.UserSessionRepository;
import com.arrowdatatech.adt_production_report.common.audit.service.ActivityLogService;
import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.process.entity.Process;
import com.arrowdatatech.adt_production_report.process.entity.UserProcessAssignment;
import com.arrowdatatech.adt_production_report.process.repository.ProcessRepository;
import com.arrowdatatech.adt_production_report.process.repository.UserProcessAssignmentRepository;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.project.entity.UserProjectAssignment;
import com.arrowdatatech.adt_production_report.project.repository.ProjectRepository;
import com.arrowdatatech.adt_production_report.project.repository.UserProjectAssignmentRepository;
import com.arrowdatatech.adt_production_report.role.entity.Role;
import com.arrowdatatech.adt_production_report.role.entity.UserRoleAssignment;
import com.arrowdatatech.adt_production_report.role.repository.RoleRepository;
import com.arrowdatatech.adt_production_report.role.repository.UserRoleAssignmentRepository;
import com.arrowdatatech.adt_production_report.shift.entity.Shift;
import com.arrowdatatech.adt_production_report.shift.entity.ShiftUserAssignment;
import com.arrowdatatech.adt_production_report.shift.repository.ShiftRepository;
import com.arrowdatatech.adt_production_report.shift.repository.ShiftUserAssignmentRepository;
import com.arrowdatatech.adt_production_report.user.dto.*;
import com.arrowdatatech.adt_production_report.user.entity.EmployeeProfile;
import com.arrowdatatech.adt_production_report.user.entity.EmployeeSalaryDetails;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.EmployeeProfileRepository;
import com.arrowdatatech.adt_production_report.user.repository.EmployeeSalaryRepository;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EmployeeProfileRepository profileRepository;
    private final EmployeeSalaryRepository salaryRepository;
    private final RoleRepository roleRepository;
    private final UserRoleAssignmentRepository roleAssignmentRepository;
    private final ShiftRepository shiftRepository;
    private final ShiftUserAssignmentRepository shiftAssignmentRepository;
    private final ProjectRepository projectRepository;
    private final UserProjectAssignmentRepository userProjectAssignmentRepository;
    private final ProcessRepository processRepository;
    private final UserProcessAssignmentRepository userProcessAssignmentRepository;
    private final UserSessionRepository sessionRepository;
    private final AttendanceEmployeeRepository attendanceEmployeeRepository;
    private final ActivityLogService activityLogService;
    private final PasswordEncoder passwordEncoder;

    // ─────────────────────────────────────────────
    // GET ALL USERS - User Management page table
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<UserListResponse> getAllUsers() {
        List<User> users = userRepository.findByIsActiveTrueAndDeletedAtIsNull();
        List<UserListResponse> responses = users.stream()
                .map(this::toUserListResponse)
                .collect(Collectors.toList());

        responses.sort((a, b) -> {
            int pA = getRolePriority(a.getRole());
            int pB = getRolePriority(b.getRole());
            if (pA != pB) {
                return Integer.compare(pA, pB);
            }
            String codeA = a.getUserCode() != null ? a.getUserCode() : "";
            String codeB = b.getUserCode() != null ? b.getUserCode() : "";
            return codeA.compareToIgnoreCase(codeB);
        });

        return responses;
    }

    private int getRolePriority(String role) {
        if (role == null) return 99;
        switch (role.trim().toLowerCase()) {
            case "admin": return 1;
            case "manager": return 2;
            case "team leader": return 3;
            case "executive": return 4;
            case "viewer": return 5;
            default: return 99;
        }
    }

    // ─────────────────────────────────────────────
    // GET LEAVE APPROVERS (Admin, Manager, Team Leader)
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<UserListResponse> getApprovers() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findByIdWithProfile(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        boolean isCurrentUserAdmin = currentUser.getRoleAssignments().stream()
                .anyMatch(ra -> "Admin".equals(ra.getRole().getName()));

        boolean isCurrentUserManager = currentUser.getRoleAssignments().stream()
                .anyMatch(ra -> "Manager".equals(ra.getRole().getName()));

        List<User> users;
        if (isCurrentUserAdmin || isCurrentUserManager) {
            // Only admins
            users = userRepository.findByRoleName("Admin");
        } else {
            // Admins and Managers
            List<User> admins = userRepository.findByRoleName("Admin");
            List<User> managers = userRepository.findByRoleName("Manager");
            users = new java.util.ArrayList<>();
            users.addAll(admins);
            users.addAll(managers);
        }

        // Filter out current user unless they are an Admin
        return users.stream()
                .filter(u -> isCurrentUserAdmin || !u.getId().equals(currentUserId))
                .map(this::toUserListResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET ALL USERS INCLUDING INACTIVE
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<UserListResponse> searchUsers(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return userRepository.searchUsers(search, pageable)
                .map(this::toUserListResponse);
    }

    // ─────────────────────────────────────────────
    // GET USER BY ID - Full detail
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID userId) {
        User user = userRepository.findByIdWithProfile(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User", "id", userId));
        return toUserResponse(user);
    }

    // ─────────────────────────────────────────────
    // CREATE USER
    // ─────────────────────────────────────────────
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        log.debug(">>> fullName received: '{}'", request.getFullName());
        log.debug(">>> userCode received: '{}'", request.getUserCode());
        // Validate unique user_code
        if (userRepository.existsByUserCode(request.getUserCode())) {
            throw new BadRequestException(
                    "User ID '" + request.getUserCode() + "' already exists.");
        }

        // Validate unique email
        if (request.getEmail() != null
                && userRepository.existsByEmailAndDeletedAtIsNull(
                request.getEmail())) {
            throw new BadRequestException(
                    "Email '" + request.getEmail() + "' is already in use.");
        }

        // 1. Create user auth record
        User user = User.builder()
                .userCode(request.getUserCode())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .isActive(request.getIsActive() != null
                        ? request.getIsActive() : true)
                .updatedAt(OffsetDateTime.now())
                .build();
        user = userRepository.saveAndFlush(user);

        // 2. Create employee profile
        EmployeeProfile profile = EmployeeProfile.builder()
                .user(user)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .timezone(request.getTimezone() != null
                        ? request.getTimezone() : "Asia/Kolkata")
                .joiningDate(request.getJoiningDate())
                .isTopPerformer(request.getIsTopPerformer() != null
                        ? request.getIsTopPerformer() : false)
                .showCalendarStats(request.getShowCalendarStats() != null
                        ? request.getShowCalendarStats() : true)
                .updatedAt(OffsetDateTime.now())
                .build();
        profileRepository.saveAndFlush(profile);

        // 3. Create empty salary record
        EmployeeSalaryDetails salary = EmployeeSalaryDetails.builder()
                .user(user)
                .salaryType("Monthly")
                .updatedAt(OffsetDateTime.now())
                .build();
        salaryRepository.saveAndFlush(salary);

        // 4. Assign role
        String roleName = request.getRoleName() != null
                ? request.getRoleName() : "Executive";
        assignRoleToUser(user, roleName);

        // Sync to AttendanceEmployee
        syncAttendanceEmployeeOnCreate(user, profile, roleName);

        // 5. Assign shift if provided
        if (request.getShiftId() != null) {
            assignShiftToUser(user, request.getShiftId());
        }

        // 6. Log activity
        User currentUser = getCurrentUser();
        activityLogService.log(currentUser, "CREATE", "employee",
                user.getId(), profile.getFullName(), null);

        log.info("User created: {} ({})", profile.getFullName(),
                user.getEmail());

        return toUserResponse(
                userRepository.findByIdWithProfile(user.getId()).orElseThrow());
    }

    // ─────────────────────────────────────────────
    // UPDATE USER
    // ─────────────────────────────────────────────
    @Transactional
    public UserResponse updateUser(UUID userId, UpdateUserRequest request) {

        User user = userRepository.findByIdWithProfile(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User", "id", userId));

        EmployeeProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Profile", "userId", userId));

        // Update email if changed
        if (request.getEmail() != null
                && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmailAndDeletedAtIsNull(
                    request.getEmail())) {
                throw new BadRequestException("Email already in use.");
            }
            user.setEmail(request.getEmail());
        }

        // Update active status
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
            // Revoke all sessions if deactivating
            if (!request.getIsActive()) {
                sessionRepository.revokeAllByUserId(userId);
                log.info("Revoked all sessions for deactivated user: {}",
                        userId);
            }
        }

        user.setUpdatedAt(OffsetDateTime.now());
        userRepository.save(user);

        // Update profile fields
        if (request.getFullName() != null) {
            profile.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            profile.setPhone(request.getPhone());
        }
        if (request.getTimezone() != null) {
            profile.setTimezone(request.getTimezone());
        }
        if (request.getIsTopPerformer() != null) {
            profile.setIsTopPerformer(request.getIsTopPerformer());
        }
        if (request.getShowCalendarStats() != null) {
            profile.setShowCalendarStats(request.getShowCalendarStats());
        }
        if (request.getJoiningDate() != null) {
            profile.setJoiningDate(request.getJoiningDate());
        }
        profile.setUpdatedAt(OffsetDateTime.now());
        profileRepository.save(profile);

        // Update role if changed
        if (request.getRoleName() != null) {
            roleAssignmentRepository.deleteAllByUserId(userId);
            assignRoleToUser(user, request.getRoleName());
        }

        // Update shift if changed
        if (request.getShiftId() != null) {
            assignShiftToUser(user, request.getShiftId());
        }

        // Sync to AttendanceEmployee if exists
        try {
            String roleToUse = request.getRoleName();
            if (roleToUse == null) {
                List<String> roles = roleAssignmentRepository.findRoleNamesByUserId(userId);
                roleToUse = roles.isEmpty() ? "Executive" : roles.get(0);
            }
            final String finalRole = roleToUse;
            
            attendanceEmployeeRepository.findByUserId(userId).ifPresentOrElse(
                emp -> {
                    if (request.getFullName() != null) {
                        emp.setName(request.getFullName().trim());
                    }
                    if (request.getIsActive() != null) {
                        emp.setIsActive(request.getIsActive());
                    }
                    if (request.getRoleName() != null) {
                        emp.setCategory(request.getRoleName());
                    }
                    emp.setUpdatedAt(OffsetDateTime.now());
                    attendanceEmployeeRepository.save(emp);
                    log.info("Synchronized AttendanceEmployee updates for userId {}", userId);
                },
                () -> {
                    int sortOrder = (int) attendanceEmployeeRepository.count() + 1;
                    AttendanceEmployee newEmp = AttendanceEmployee.builder()
                            .userId(user.getId())
                            .name(profile.getFullName().trim())
                            .category(finalRole)
                            .isActive(user.getIsActive())
                            .sortOrder(sortOrder)
                            .baseSalary(new java.math.BigDecimal("5000.00"))
                            .updatedAt(OffsetDateTime.now())
                            .build();
                    attendanceEmployeeRepository.save(newEmp);
                    log.info("Created missing AttendanceEmployee '{}' during user update for userId {}", newEmp.getName(), user.getId());
                }
            );
        } catch (Exception e) {
            log.error("Failed to sync AttendanceEmployee on user update", e);
        }

        // Log activity
        User currentUser = getCurrentUser();
        activityLogService.log(currentUser, "UPDATE", "employee",
                userId, profile.getFullName(), null);

        return toUserResponse(
                userRepository.findByIdWithProfile(userId).orElseThrow());
    }

    // ─────────────────────────────────────────────
    // SOFT DELETE USER
    // ─────────────────────────────────────────────
    // ─────────────────────────────────────────────
    // SOFT DELETE USER (Fixed for Unique Constraints)
    // ─────────────────────────────────────────────
    // ─────────────────────────────────────────────
    // SOFT DELETE USER (Fixed for Unique Constraints & Length Limits)
    // ─────────────────────────────────────────────
    @Transactional
    public void deleteUser(UUID userId) {
        User user = userRepository.findByIdWithProfile(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User", "id", userId));

        // Prevent deleting yourself
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (userId.equals(currentUserId)) {
            throw new BadRequestException("You cannot delete your own account.");
        }

        // Revoke all active sessions
        sessionRepository.revokeAllByUserId(userId);

        // THE FIX: Create a compact suffix using Base36 encoding (e.g., "_d_lqw12x")
        String compactSuffix = "_d_" + Long.toString(System.currentTimeMillis(), 36);

        // 1. Safely handle user_code (VARCHAR 20 Limit)
        int maxCodePrefix = 20 - compactSuffix.length();
        String originalCode = user.getUserCode();
        String safeUserCode = originalCode.length() > maxCodePrefix
                ? originalCode.substring(0, maxCodePrefix) + compactSuffix
                : originalCode + compactSuffix;

        user.setUserCode(safeUserCode);

        // 2. Safely handle email (Usually VARCHAR 255, but truncating just in case)
        if (user.getEmail() != null) {
            int maxEmailPrefix = 255 - compactSuffix.length();
            String originalEmail = user.getEmail();
            String safeEmail = originalEmail.length() > maxEmailPrefix
                    ? originalEmail.substring(0, maxEmailPrefix) + compactSuffix
                    : originalEmail + compactSuffix;

            user.setEmail(safeEmail);
        }

        user.setIsActive(false);
        user.setDeletedAt(OffsetDateTime.now());

        // Save the updated entity
        userRepository.save(user);

        // Deactivate matching AttendanceEmployee
        try {
            attendanceEmployeeRepository.findByUserId(userId).ifPresent(emp -> {
                emp.setIsActive(false);
                emp.setUpdatedAt(OffsetDateTime.now());
                attendanceEmployeeRepository.save(emp);
                log.info("Deactivated AttendanceEmployee for soft-deleted userId {}", userId);
            });
        } catch (Exception e) {
            log.error("Failed to deactivate AttendanceEmployee on user delete", e);
        }

        String fullName = user.getEmployeeProfile() != null
                ? user.getEmployeeProfile().getFullName()
                : user.getEmail();

        User currentUser = getCurrentUser();
        activityLogService.log(currentUser, "DELETE", "employee",
                userId, fullName, null);

        log.info("User soft deleted and unique fields released safely: {}", userId);
    }

    // ─────────────────────────────────────────────
    // SET PASSWORD (Admin sets for employee)
    // ─────────────────────────────────────────────
    @Transactional
    public void setPassword(UUID userId, SetPasswordRequest request) {

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match.");
        }
        if (request.getNewPassword().length() < 6) {
            throw new BadRequestException(
                    "Password must be at least 6 characters.");
        }

        User user = userRepository.findByIdWithProfile(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User", "id", userId));

        user.setPasswordHash(
                passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(OffsetDateTime.now());
        userRepository.save(user);

        // Revoke existing sessions so user must re-login
        sessionRepository.revokeAllByUserId(userId);

        User currentUser = getCurrentUser();
        String fullName = user.getEmployeeProfile() != null
                ? user.getEmployeeProfile().getFullName()
                : user.getEmail();
        activityLogService.log(currentUser, "PASSWORD_RESET", "employee",
                userId, fullName, null);
    }

    // ─────────────────────────────────────────────
    // RESET PASSWORD (Self password reset)
    // ─────────────────────────────────────────────
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match.");
        }
        if (request.getNewPassword().length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters.");
        }

        User user = getCurrentUser();

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Incorrect current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(OffsetDateTime.now());
        userRepository.save(user);

        // Revoke existing sessions so user must re-login
        sessionRepository.revokeAllByUserId(user.getId());

        String fullName = user.getEmployeeProfile() != null
                ? user.getEmployeeProfile().getFullName()
                : user.getEmail();
        activityLogService.log(user, "PASSWORD_RESET", "self",
                user.getId(), fullName, null);
    }

    // ─────────────────────────────────────────────
    // ASSIGN ROLE
    // ─────────────────────────────────────────────
    @Transactional
    public void assignRole(UUID userId, AssignRoleRequest request) {

        User user = userRepository.findByIdWithProfile(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User", "id", userId));

        // Remove existing roles
        roleAssignmentRepository.deleteAllByUserId(userId);

        // Assign new role
        assignRoleToUser(user, request.getRoleName());

        // Sync to AttendanceEmployee if exists
        try {
            attendanceEmployeeRepository.findByUserId(userId).ifPresent(emp -> {
                emp.setCategory(request.getRoleName() != null ? request.getRoleName() : "Executive");
                emp.setUpdatedAt(OffsetDateTime.now());
                attendanceEmployeeRepository.save(emp);
                log.info("Synchronized AttendanceEmployee category on role assign for userId {}", userId);
            });
        } catch (Exception e) {
            log.error("Failed to sync AttendanceEmployee on role assign", e);
        }

        String fullName = user.getEmployeeProfile() != null
                ? user.getEmployeeProfile().getFullName()
                : user.getEmail();
        User currentUser = getCurrentUser();
        activityLogService.log(currentUser, "UPDATE", "employee",
                userId, fullName,
                "{\"role\": \"" + request.getRoleName() + "\"}");
    }

    // ─────────────────────────────────────────────
    // ASSIGN PROJECTS & PROCESSES
    // ─────────────────────────────────────────────
    @Transactional
    public void assignProjectsAndProcesses(UUID userId,
                                           AssignProjectsRequest request) {

        User user = userRepository.findByIdWithProfile(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User", "id", userId));

        // Clear existing project assignments
        userProjectAssignmentRepository.deleteAllByUserId(userId);

        // Assign new projects
        if (request.getProjectIds() != null) {
            for (UUID projectId : request.getProjectIds()) {
                Project project = projectRepository.findById(projectId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Project", "id", projectId));

                UserProjectAssignment assignment =
                        UserProjectAssignment.builder()
                                .user(user)
                                .project(project)
                                .assignedBy(getCurrentUser())
                                .build();
                userProjectAssignmentRepository.save(assignment);
            }
        }

        // Clear existing process assignments
        userProcessAssignmentRepository.deleteAllByUserId(userId);

        // Assign new processes
        if (request.getProcessIds() != null) {
            for (UUID processId : request.getProcessIds()) {
                Process process = processRepository.findById(processId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Process", "id", processId));

                UserProcessAssignment assignment =
                        UserProcessAssignment.builder()
                                .user(user)
                                .process(process)
                                .assignedBy(getCurrentUser())
                                .build();
                userProcessAssignmentRepository.save(assignment);
            }
        }

        log.info("Assigned {} projects and {} processes to user {}",
                request.getProjectIds() != null
                        ? request.getProjectIds().size() : 0,
                request.getProcessIds() != null
                        ? request.getProcessIds().size() : 0,
                userId);
    }

    // ─────────────────────────────────────────────
    // GET ASSIGNED PROJECTS & PROCESSES FOR USER
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public AssignedProjectsResponse getAssignedProjectsAndProcesses(
            UUID userId) {

        List<UserProjectAssignment> projectAssignments =
                userProjectAssignmentRepository.findByUserId(userId);
        List<UserProcessAssignment> processAssignments =
                userProcessAssignmentRepository.findByUserId(userId);

        List<UUID> projectIds = projectAssignments.stream()
                .map(a -> a.getProject().getId())
                .collect(Collectors.toList());

        List<UUID> processIds = processAssignments.stream()
                .map(a -> a.getProcess().getId())
                .collect(Collectors.toList());

        return AssignedProjectsResponse.builder()
                .userId(userId)
                .projectIds(projectIds)
                .processIds(processIds)
                .build();
    }

    // ─────────────────────────────────────────────
    // GET TOP PERFORMERS (Login page display)
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<UserListResponse> getTopPerformers() {
        return userRepository.findTopPerformers().stream()
                .map(this::toUserListResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────

    private void assignRoleToUser(User user, String roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Role", "name", roleName));

        boolean alreadyAssigned = roleAssignmentRepository
                .existsByUserIdAndRoleId(user.getId(), role.getId());

        if (!alreadyAssigned) {
            UserRoleAssignment assignment = UserRoleAssignment.builder()
                    .user(user)
                    .role(role)
                    .assignedBy(getCurrentUserOrNull())
                    .build();
            roleAssignmentRepository.save(assignment);
        }
    }

    private void assignShiftToUser(User user, UUID shiftId) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Shift", "id", shiftId));

        // Close existing shift
        shiftAssignmentRepository.closeCurrentShift(
                user.getId(), LocalDate.now());

        // Create new assignment
        ShiftUserAssignment assignment = ShiftUserAssignment.builder()
                .user(user)
                .shift(shift)
                .effectiveFrom(LocalDate.now())
                .assignedBy(getCurrentUserOrNull())
                .build();
        shiftAssignmentRepository.save(assignment);
    }

    private User getCurrentUser() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        return userRepository.findByIdWithProfile(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Current user not found"));
    }

    private User getCurrentUserOrNull() {
        try {
            return getCurrentUser();
        } catch (Exception e) {
            return null;
        }
    }

    private void syncAttendanceEmployeeOnCreate(User user, EmployeeProfile profile, String roleName) {
        try {
            String category = roleName != null ? roleName : "Executive";
            
            // Check if there is an existing unlinked AttendanceEmployee with the same name
            List<AttendanceEmployee> existing = attendanceEmployeeRepository.searchEmployees(null, profile.getFullName().trim());
            if (!existing.isEmpty()) {
                AttendanceEmployee emp = null;
                for (AttendanceEmployee ae : existing) {
                    if (ae.getUserId() == null) {
                        emp = ae;
                        break;
                    }
                }
                
                if (emp != null) {
                    emp.setUserId(user.getId());
                    emp.setCategory(category);
                    emp.setIsActive(user.getIsActive());
                    emp.setUpdatedAt(OffsetDateTime.now());
                    attendanceEmployeeRepository.save(emp);
                    log.info("Linked existing unlinked AttendanceEmployee '{}' to userId {}", emp.getName(), user.getId());
                    return;
                }
            }
            
            int sortOrder = (int) attendanceEmployeeRepository.count() + 1;
            AttendanceEmployee newEmp = AttendanceEmployee.builder()
                    .userId(user.getId())
                    .name(profile.getFullName().trim())
                    .category(category)
                    .isActive(user.getIsActive())
                    .sortOrder(sortOrder)
                    .baseSalary(new java.math.BigDecimal("5000.00"))
                    .updatedAt(OffsetDateTime.now())
                    .build();
            attendanceEmployeeRepository.save(newEmp);
            log.info("Created new AttendanceEmployee '{}' for userId {}", newEmp.getName(), user.getId());
        } catch (Exception e) {
            log.error("Failed to sync AttendanceEmployee on user creation", e);
        }
    }

    private String mapRoleToCategory(String roleName) {
        if (roleName == null) return "Executive";
        switch (roleName) {
            case "Admin": return "Admin";
            case "Manager": return "Manager";
            case "Team Leader": return "Team Leader";
            case "Executive": return "Executive";
            default: return "Executive";
        }
    }

    // ─────────────────────────────────────────────
    // MAPPING HELPERS
    // ─────────────────────────────────────────────

    private UserListResponse toUserListResponse(User user) {
        EmployeeProfile profile = user.getEmployeeProfile();

        List<String> roles = roleAssignmentRepository
                .findRoleNamesByUserId(user.getId());

        String primaryRole = roles.isEmpty() ? "Executive" : roles.get(0);

        String currentShift = shiftAssignmentRepository
                .findByUserIdAndEffectiveToIsNull(user.getId())
                .map(s -> s.getShift().getName())
                .orElse("-");

        return UserListResponse.builder()
                .id(user.getId())
                .userCode(user.getUserCode())
                .fullName(profile != null ? profile.getFullName() : "")
                .email(user.getEmail())
                .phone(profile != null ? profile.getPhone() : null)
                .role(primaryRole)
                .shift(currentShift)
                .isActive(user.getIsActive())
                .isTopPerformer(profile != null
                        ? profile.getIsTopPerformer() : false)
                .profilePhotoUrl(null)
                .build();
    }

    private UserResponse toUserResponse(User user) {
        EmployeeProfile profile = user.getEmployeeProfile();

        List<String> roles = roleAssignmentRepository
                .findRoleNamesByUserId(user.getId());

        String currentShift = shiftAssignmentRepository
                .findByUserIdAndEffectiveToIsNull(user.getId())
                .map(s -> s.getShift().getName())
                .orElse(null);

        UUID currentShiftId = shiftAssignmentRepository
                .findByUserIdAndEffectiveToIsNull(user.getId())
                .map(s -> s.getShift().getId())
                .orElse(null);

        return UserResponse.builder()
                .id(user.getId())
                .userCode(user.getUserCode())
                .email(user.getEmail())
                .fullName(profile != null ? profile.getFullName() : "")
                .phone(profile != null ? profile.getPhone() : null)
                .timezone(profile != null
                        ? profile.getTimezone() : "Asia/Kolkata")
                .isActive(user.getIsActive())
                .isTopPerformer(profile != null
                        ? profile.getIsTopPerformer() : false)
                .showCalendarStats(profile != null
                        ? profile.getShowCalendarStats() : true)
                .joiningDate(profile != null
                        ? profile.getJoiningDate() : null)
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .roles(roles)
                .currentShift(currentShift)
                .currentShiftId(currentShiftId)
                .profilePhotoUrl(null)
                .build();
    }

    // ─────────────────────────────────────────────
    // UPDATE OWN PROFILE (Safe Fields Only)
    // ─────────────────────────────────────────────
//    @Transactional
//    public UserResponse updateMyProfile(UpdateProfileRequest request) {
//
//        // 1. Get the current user securely from the token, not the URL
//        User user = getCurrentUser();
//        EmployeeProfile profile = user.getEmployeeProfile();
//
//        // 2. Only allow updating safe fields. Notice we DO NOT accept
//        // roleName, isActive, or shiftId in this request object.
//        if (request.getPhone() != null) {
//            profile.setPhone(request.getPhone());
//        }
//        if (request.getTimezone() != null) {
//            profile.setTimezone(request.getTimezone());
//        }
//
//        profile.setUpdatedAt(OffsetDateTime.now());
//        profileRepository.save(profile);
//
//        // 3. Log the safe activity
//        activityLogService.log(user, "UPDATE", "profile",
//                user.getId(), profile.getFullName(), "Self-updated profile");
//
//        return toUserResponse(user);
//    }
}






