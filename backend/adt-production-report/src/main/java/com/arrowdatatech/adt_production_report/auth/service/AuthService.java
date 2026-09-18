package com.arrowdatatech.adt_production_report.auth.service;

import com.arrowdatatech.adt_production_report.auth.dto.*;
import com.arrowdatatech.adt_production_report.auth.entity.ImpersonationLog;
import com.arrowdatatech.adt_production_report.auth.entity.UserSession;
import com.arrowdatatech.adt_production_report.auth.repository.ImpersonationLogRepository;
import com.arrowdatatech.adt_production_report.auth.repository.UserSessionRepository;
import com.arrowdatatech.adt_production_report.common.audit.service.ActivityLogService;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.common.exception.UnauthorizedException;
import com.arrowdatatech.adt_production_report.media.service.MediaService;
import com.arrowdatatech.adt_production_report.role.repository.PermissionRepository;
import com.arrowdatatech.adt_production_report.role.repository.UserRoleAssignmentRepository;
import com.arrowdatatech.adt_production_report.user.entity.EmployeeProfile;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
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
    private final LoginAttendanceService loginAttendanceService;
    private final ActivityLogService activityLogService;
    private final ImpersonationLogRepository impersonationLogRepository;
    private final MediaService mediaService;

    @Transactional
    public LoginResponse login(LoginRequest request,
                               String ipAddress,
                               String userAgent) {

        try {

            log.info("STEP 1 - Authenticating user");

            User user = authenticateUser(
                    request.getIdentifier().trim(),
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
            String profilePhotoUrl = resolveProfilePhotoUrl(user.getEmployeeProfile());

            log.info("STEP 11 SUCCESS - Building response");

            return LoginResponse.builder()
                    .userId(user.getId())
                    .userCode(user.getUserCode())
                    .email(user.getEmail())
                    .fullName(fullName)
                    .profilePhotoUrl(profilePhotoUrl)
                    .roles(roles)
                    .permissions(permissions)
                    .accessToken(accessToken)
                    .refreshToken(rawRefreshToken)
                    .tokenType("Bearer")
                    .dashboardType(dashboardType)
                    .build();

        } catch (UnauthorizedException ex) {
            log.warn("LOGIN REJECTED - {}", ex.getMessage());
            throw ex;
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
                .impersonatedBy(session.getImpersonatedBy())
                .isActive(true)
                .build();
        sessionRepository.save(newSession);

        String fullName = user.getEmployeeProfile() != null
                ? user.getEmployeeProfile().getFullName()
                : user.getEmail();
        String profilePhotoUrl = resolveProfilePhotoUrl(user.getEmployeeProfile());

        return LoginResponse.builder()
                .userId(user.getId())
                .userCode(user.getUserCode())
                .email(user.getEmail())
                .fullName(fullName)
                .profilePhotoUrl(profilePhotoUrl)
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
        String profilePhotoUrl = resolveProfilePhotoUrl(targetUser.getEmployeeProfile());

        boolean targetIsAdminOrManagerOrTl = roles.contains("Admin") 
                || roles.contains("Manager") 
                || roles.contains("Team Leader");
        String dashboardType = targetIsAdminOrManagerOrTl ? "ADMIN" : "EMPLOYEE";

        return LoginResponse.builder()
                .userId(targetUser.getId())
                .userCode(targetUser.getUserCode())
                .email(targetUser.getEmail())
                .fullName(fullName)
                .profilePhotoUrl(profilePhotoUrl)
                .roles(roles)
                .permissions(permissions)
                .accessToken(accessToken)
                .refreshToken(rawRefresh)
                .tokenType("Bearer")
                .dashboardType(dashboardType)
                .build();
    }

    @Transactional(readOnly = true)
    public LoginResponse getProfile(UUID userId) {
        User user = userRepository.findByIdWithProfile(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        List<String> roles = roleAssignmentRepository
                .findRoleNamesByUserId(user.getId());

        List<String> permissions = permissionRepository
                .findPermissionCodesByUserId(user.getId())
                .stream().toList();

        boolean isAdminDashboard = roles.contains("Admin")
                || roles.contains("Manager")
                || roles.contains("Team Leader");
        String dashboardType = isAdminDashboard ? "ADMIN" : "EMPLOYEE";

        String fullName = user.getEmployeeProfile() != null
                ? user.getEmployeeProfile().getFullName()
                : user.getEmail();
        String profilePhotoUrl = resolveProfilePhotoUrl(user.getEmployeeProfile());

        return LoginResponse.builder()
                .userId(user.getId())
                .userCode(user.getUserCode())
                .email(user.getEmail())
                .fullName(fullName)
                .profilePhotoUrl(profilePhotoUrl)
                .roles(roles)
                .permissions(permissions)
                .dashboardType(dashboardType)
                .build();
    }

    // ──────────────────────────────────────────────
    // PRIVATE HELPERS
    // ──────────────────────────────────────────────

    private User authenticateUser(String identifier, String password) {
        User user = findUserByIdentifier(identifier);
        synchronizeActiveStatusFromProfile(user);
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            identifier, password));
        } catch (AccountStatusException e) {
            throw new UnauthorizedException(
                    "Account is deactivated. Contact your administrator.");
        } catch (AuthenticationException e) {
            throw new UnauthorizedException(
                    "Invalid credentials. Please check your email/ID and password.");
        }

        return user;
    }

    private User findUserByIdentifier(String identifier) {
        if (identifier.contains("@")) {
            return userRepository.findByEmailAndDeletedAtIsNull(identifier)
                    .orElseThrow(() -> new UnauthorizedException(
                            "Invalid credentials. Please check your email/ID and password."));
        }
        return userRepository.findByUserCodeAndDeletedAtIsNull(identifier)
                .orElseThrow(() -> new UnauthorizedException(
                        "Invalid credentials. Please check your email/ID and password."));
    }

    private void synchronizeActiveStatusFromProfile(User user) {
        EmployeeProfile profile = user.getEmployeeProfile();
        if (profile == null || profile.getEmployeeStatus() == null) {
            return;
        }

        boolean profileAllowsLogin = "Active".equalsIgnoreCase(profile.getEmployeeStatus());
        if (!profileAllowsLogin) {
            if (Boolean.TRUE.equals(user.getIsActive())) {
                user.setIsActive(false);
                user.setUpdatedAt(OffsetDateTime.now());
                userRepository.saveAndFlush(user);
            }
            throw new UnauthorizedException(
                    "Account is " + profile.getEmployeeStatus() + ". Contact your administrator.");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            user.setIsActive(true);
            user.setUpdatedAt(OffsetDateTime.now());
            userRepository.saveAndFlush(user);
            log.info("Reactivated login for active profile user {}", user.getId());
        }
    }



    private void ensureAttendanceEmployeeExists(User user) {
        try {
            String fullName = user.getEmployeeProfile() != null
                    ? user.getEmployeeProfile().getFullName() : user.getEmail();
            if (fullName == null || fullName.isBlank()) {
                fullName = user.getUserCode();
            }
            loginAttendanceService.ensureEmployee(user.getId(), fullName,
                    roleAssignmentRepository.findRoleNamesByUserId(user.getId()));
        } catch (Exception e) {
            // Catch outside the independent transaction, including commit failures.
            log.warn("Could not initialize attendance for user {}: {}",
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

    private String resolveProfilePhotoUrl(EmployeeProfile profile) {
        if (profile == null || !mediaService.isAvailable(profile.getProfilePhoto())) {
            return null;
        }
        return "/media/" + profile.getProfilePhoto().getId();
    }
}
