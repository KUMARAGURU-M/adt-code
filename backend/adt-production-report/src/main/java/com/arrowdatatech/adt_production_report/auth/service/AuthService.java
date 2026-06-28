package com.arrowdatatech.adt_production_report.auth.service;

import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceEmployee;
import com.arrowdatatech.adt_production_report.attendance.repository.AttendanceEmployeeRepository;
import com.arrowdatatech.adt_production_report.auth.dto.*;
import com.arrowdatatech.adt_production_report.auth.entity.ImpersonationLog;
import com.arrowdatatech.adt_production_report.auth.entity.UserSession;
import com.arrowdatatech.adt_production_report.auth.repository.ImpersonationLogRepository;
import com.arrowdatatech.adt_production_report.auth.repository.UserSessionRepository;
import com.arrowdatatech.adt_production_report.common.audit.service.ActivityLogService;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.common.exception.UnauthorizedException;
import com.arrowdatatech.adt_production_report.role.repository.PermissionRepository;
import com.arrowdatatech.adt_production_report.role.repository.UserRoleAssignmentRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceRecord;
import com.arrowdatatech.adt_production_report.attendance.repository.AttendanceRecordRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final UserRoleAssignmentRepository roleAssignmentRepository;
    private final PermissionRepository permissionRepository;
    private final AttendanceEmployeeRepository attendanceEmployeeRepository;
    private final AttendanceRecordRepository   attendanceRecordRepository;
    private final ActivityLogService activityLogService;
    private final ImpersonationLogRepository impersonationLogRepository;

    @Transactional
    public LoginResponse login(LoginRequest request,
                               String ipAddress,
                               String userAgent) {

        try {

            log.info("STEP 1 - Authenticating user");

            User user = authenticateUser(
                    request.getIdentifier(),
                    request.getPassword());

            log.info("STEP 1 SUCCESS - User: {}", user.getEmail());

            log.info("STEP 2 - Loading roles");

            List<String> roles = roleAssignmentRepository
                    .findRoleNamesByUserId(user.getId());

            log.info("STEP 2 SUCCESS - Roles: {}", roles);

            log.info("STEP 3 - Skipping login type validation (credential-based routing)");

            log.info("STEP 3 SUCCESS");

            log.info("STEP 4 - Loading permissions");

            List<String> permissions = permissionRepository
                    .findPermissionCodesByUserId(user.getId())
                    .stream()
                    .toList();

            log.info("STEP 4 SUCCESS - Permissions: {}", permissions.size());

            log.info("STEP 5 - Generating access token");

            String accessToken = jwtTokenProvider
                    .generateAccessToken(
                            user.getId(),
                            roles,
                            permissions);

            log.info("STEP 5 SUCCESS");

            log.info("STEP 6 - Generating refresh token");

            String rawRefreshToken = jwtTokenProvider
                    .generateRefreshToken(user.getId());

            String hashedRefreshToken = hashToken(rawRefreshToken);

            log.info("STEP 6 SUCCESS");

            log.info("STEP 7 - Saving session");

            UserSession session = UserSession.builder()
                    .user(user)
                    .refreshToken(hashedRefreshToken)
                    .expiresAt(OffsetDateTime.now().plusSeconds(
                            jwtTokenProvider.getRefreshTokenExpiry() / 1000))
                    .ipAddress(ipAddress)
                    .deviceInfo(userAgent)
                    .isActive(true)
                    .build();

            sessionRepository.save(session);

            log.info("STEP 7 SUCCESS");

            log.info("STEP 8 - Updating last login");

            userRepository.updateLastLogin(
                    user.getId(),
                    OffsetDateTime.now());

            log.info("STEP 8 SUCCESS");

            log.info("STEP 9 - Ensuring attendance employee profile exists");

            ensureAttendanceEmployeeExists(user);

            log.info("STEP 9 SUCCESS");

            log.info("STEP 10 - Logging activity");

            activityLogService.logLogin(user);

            log.info("STEP 10 SUCCESS");

            boolean isAdminDashboard = roles.contains("Admin")
                    || roles.contains("Manager")
                    || roles.contains("Team Leader");
            String dashboardType = isAdminDashboard ? "ADMIN" : "EMPLOYEE";

            String fullName =
                    user.getEmployeeProfile() != null
                            ? user.getEmployeeProfile().getFullName()
                            : user.getEmail();

            log.info("STEP 11 SUCCESS - Building response");

            return LoginResponse.builder()
                    .userId(user.getId())
                    .userCode(user.getUserCode())
                    .email(user.getEmail())
                    .fullName(fullName)
                    .roles(roles)
                    .permissions(permissions)
                    .accessToken(accessToken)
                    .refreshToken(rawRefreshToken)
                    .tokenType("Bearer")
                    .dashboardType(dashboardType)
                    .build();

        } catch (Exception ex) {

            log.error("LOGIN FAILED", ex);

            throw ex;
        }
    }

    @Transactional
    public void logout(String refreshToken, UUID userId) {
        sessionRepository.revokeByRefreshToken(hashToken(refreshToken));
        userRepository.findByIdWithProfile(userId).ifPresent(
                activityLogService::logLogout);
    }

    @Transactional
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        String rawToken = request.getRefreshToken();

        if (!jwtTokenProvider.validateToken(rawToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }
        if (!jwtTokenProvider.isRefreshToken(rawToken)) {
            throw new UnauthorizedException("Not a refresh token");
        }

        String hashedToken = hashToken(rawToken);
        UserSession session = sessionRepository
                .findByRefreshTokenAndIsActiveTrue(hashedToken)
                .orElseThrow(() -> new UnauthorizedException(
                        "Refresh token not found or revoked"));

        sessionRepository.revokeByRefreshToken(hashedToken);

        User user = session.getUser();
        List<String> roles = roleAssignmentRepository
                .findRoleNamesByUserId(user.getId());
        List<String> permissions = permissionRepository
                .findPermissionCodesByUserId(user.getId())
                .stream().toList();

        String newAccessToken = jwtTokenProvider
                .generateAccessToken(user.getId(), roles, permissions);
        String newRawRefresh = jwtTokenProvider
                .generateRefreshToken(user.getId());

        UserSession newSession = UserSession.builder()
                .user(user)
                .refreshToken(hashToken(newRawRefresh))
                .expiresAt(OffsetDateTime.now().plusSeconds(
                        jwtTokenProvider.getRefreshTokenExpiry() / 1000))
                .ipAddress(session.getIpAddress())
                .deviceInfo(session.getDeviceInfo())
                .isActive(true)
                .build();
        sessionRepository.save(newSession);

        String fullName = user.getEmployeeProfile() != null
                ? user.getEmployeeProfile().getFullName()
                : user.getEmail();

        return LoginResponse.builder()
                .userId(user.getId())
                .userCode(user.getUserCode())
                .email(user.getEmail())
                .fullName(fullName)
                .roles(roles)
                .permissions(permissions)
                .accessToken(newAccessToken)
                .refreshToken(newRawRefresh)
                .tokenType("Bearer")
                .build();
    }

    @Transactional
    public LoginResponse impersonateUser(UUID adminId, UUID targetUserId) {
        User admin = userRepository.findByIdWithProfile(adminId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Admin user not found"));
        User targetUser = userRepository.findByIdWithProfile(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Target user not found"));

        ImpersonationLog impLog = ImpersonationLog.builder()
                .admin(admin)
                .targetUser(targetUser)
                .startedAt(OffsetDateTime.now())
                .build();
        impersonationLogRepository.save(impLog);

        List<String> roles = roleAssignmentRepository
                .findRoleNamesByUserId(targetUser.getId());
        List<String> permissions = permissionRepository
                .findPermissionCodesByUserId(targetUser.getId())
                .stream().toList();

        String accessToken = jwtTokenProvider
                .generateAccessToken(targetUser.getId(), roles, permissions);
        String rawRefresh = jwtTokenProvider
                .generateRefreshToken(targetUser.getId());

        UserSession session = UserSession.builder()
                .user(targetUser)
                .refreshToken(hashToken(rawRefresh))
                .expiresAt(OffsetDateTime.now().plusSeconds(
                        jwtTokenProvider.getRefreshTokenExpiry() / 1000))
                .isActive(true)
                .impersonatedBy(admin)
                .build();
        sessionRepository.save(session);

        String fullName = targetUser.getEmployeeProfile() != null
                ? targetUser.getEmployeeProfile().getFullName()
                : targetUser.getEmail();

        boolean targetIsAdminOrManagerOrTl = roles.contains("Admin") 
                || roles.contains("Manager") 
                || roles.contains("Team Leader");
        String dashboardType = targetIsAdminOrManagerOrTl ? "ADMIN" : "EMPLOYEE";

        return LoginResponse.builder()
                .userId(targetUser.getId())
                .userCode(targetUser.getUserCode())
                .email(targetUser.getEmail())
                .fullName(fullName)
                .roles(roles)
                .permissions(permissions)
                .accessToken(accessToken)
                .refreshToken(rawRefresh)
                .tokenType("Bearer")
                .dashboardType(dashboardType)
                .build();
    }

    // ──────────────────────────────────────────────
    // PRIVATE HELPERS
    // ──────────────────────────────────────────────

    private User authenticateUser(String identifier, String password) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            identifier, password));
        } catch (DisabledException e) {
            throw new UnauthorizedException(
                    "Account is deactivated. Contact your administrator.");
        } catch (BadCredentialsException e) {
            throw new UnauthorizedException(
                    "Invalid credentials. Please check your email/ID and password.");
        }

        if (identifier.contains("@")) {
            return userRepository.findByEmailAndDeletedAtIsNull(identifier)
                    .orElseThrow(() -> new UnauthorizedException(
                            "User not found"));
        }
        return userRepository.findByUserCodeAndDeletedAtIsNull(identifier)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private void validateLoginType(User user, String loginType,
                                   List<String> roles) {

        boolean isAdmin = roles.contains("Admin");
        boolean isManager = roles.contains("Manager");
        boolean isAdminOrManager = isAdmin || isManager;
        boolean isEmployeeOrTeamLeader = roles.contains("Employee")
                || roles.contains("Team Leader");

        log.info("Validating login type '{}' for roles: {}",
                loginType, roles);

        if ("Admin".equalsIgnoreCase(loginType)) {
            // Admin tab: only Admin and Manager roles allowed
            if (!isAdminOrManager) {
                throw new UnauthorizedException(
                        "Access denied. Please use Employee Login.");
            }
        } else {
            // Employee tab: only non-admin roles allowed
            // Unless user has BOTH admin AND employee roles
            if (isAdminOrManager && !isEmployeeOrTeamLeader) {
                throw new UnauthorizedException(
                        "Access denied. Please use Admin Login.");
            }
        }
    }

    private void ensureAttendanceEmployeeExists(User user) {
        try {
            AttendanceEmployee emp = attendanceEmployeeRepository.findByUserId(user.getId())
                    .orElseGet(() -> {
                        String fullName = user.getEmployeeProfile() != null
                                ? user.getEmployeeProfile().getFullName()
                                : null;
                        if (fullName != null) {
                            List<AttendanceEmployee> employees =
                                    attendanceEmployeeRepository.searchEmployees(null, fullName.trim());
                            if (!employees.isEmpty()) {
                                AttendanceEmployee existing = employees.get(0);
                                existing.setUserId(user.getId());
                                existing.setUpdatedAt(OffsetDateTime.now());
                                return attendanceEmployeeRepository.save(existing);
                            }
                        }
                        return null;
                    });

            if (emp == null) {
                String fullName = user.getEmployeeProfile() != null
                        ? user.getEmployeeProfile().getFullName()
                        : user.getEmail();
                
                String category = "Employee";
                List<String> roles = roleAssignmentRepository.findRoleNamesByUserId(user.getId());
                if (!roles.isEmpty()) {
                    String primaryRole = roles.get(0);
                    if (List.of("Admin", "Employee", "Team Leader", "Manager", "Senior Operator", "Operator", "Coordinator")
                            .contains(primaryRole)) {
                        category = primaryRole;
                    }
                }

                int sortOrder = (int) attendanceEmployeeRepository.count() + 1;
                emp = AttendanceEmployee.builder()
                        .userId(user.getId())
                        .name(fullName.trim())
                        .category(category)
                        .isActive(true)
                        .sortOrder(sortOrder)
                        .baseSalary(new java.math.BigDecimal("5000.00"))
                        .updatedAt(OffsetDateTime.now())
                        .build();
                attendanceEmployeeRepository.save(emp);
                log.info("Auto-created AttendanceEmployee '{}' for user during login", emp.getName());
            }
        } catch (Exception e) {
            log.warn("Could not auto-create attendance employee profile for user {}: {}",
                    user.getId(), e.getMessage());
        }
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(
                    token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }
}