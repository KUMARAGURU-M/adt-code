package com.arrowdatatech.adt_production_report.role.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.role.entity.Permission;
import com.arrowdatatech.adt_production_report.role.entity.UserPermission;
import com.arrowdatatech.adt_production_report.role.repository.PermissionRepository;
import com.arrowdatatech.adt_production_report.role.repository.UserPermissionRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/user-page-access")
@RequiredArgsConstructor
public class UserPageAccessController {

    private final UserPermissionRepository userPermissionRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;

    /**
     * GET /user-page-access/{userId}
     * Returns the sets of direct granted and direct denied permission codes for a user.
     */
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('Admin') or hasAuthority('roles.view')")
    public ResponseEntity<ApiResponse<com.arrowdatatech.adt_production_report.role.dto.UserPageAccessResponse>> getDirectPermissions(
            @PathVariable UUID userId) {
        Set<String> granted = userPermissionRepository.findDirectPermissionCodesByUserIdAndIsDenied(userId, false);
        Set<String> denied  = userPermissionRepository.findDirectPermissionCodesByUserIdAndIsDenied(userId, true);
        
        com.arrowdatatech.adt_production_report.role.dto.UserPageAccessResponse response =
                com.arrowdatatech.adt_production_report.role.dto.UserPageAccessResponse.builder()
                        .granted(granted)
                        .denied(denied)
                        .build();
        return ResponseEntity.ok(ApiResponse.success("Direct permissions retrieved", response));
    }

    /**
     * GET /user-page-access/{userId}/all
     * Returns the full union set of permission codes (role-based + direct - denied) for a user.
     */
    @GetMapping("/{userId}/all")
    @PreAuthorize("hasRole('Admin') or hasAuthority('roles.view')")
    public ResponseEntity<ApiResponse<Set<String>>> getAllPermissions(
            @PathVariable UUID userId) {
        Set<String> codes = permissionRepository.findPermissionCodesByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("All permissions retrieved", codes));
    }

    /**
     * POST /user-page-access/{userId}/{permissionId}
     * Grants a specific permission directly to a user.
     */
    @PostMapping("/{userId}/{permissionId}")
    @PreAuthorize("hasRole('Admin') or hasAuthority('roles.update')")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> grantPermission(
            @PathVariable UUID userId,
            @PathVariable UUID permissionId) {

        if (userPermissionRepository.existsByUserIdAndPermissionId(userId, permissionId)) {
            return ResponseEntity.ok(ApiResponse.success("Permission already configured", null));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new RuntimeException("Permission not found: " + permissionId));

        UserPermission up = UserPermission.builder()
                .user(user)
                .permission(permission)
                .isDenied(false)
                .build();
        userPermissionRepository.save(up);

        return ResponseEntity.ok(ApiResponse.success("Permission granted", null));
    }

    /**
     * DELETE /user-page-access/{userId}/{permissionId}
     * Revokes a specific permission from a user.
     */
    @DeleteMapping("/{userId}/{permissionId}")
    @PreAuthorize("hasRole('Admin') or hasAuthority('roles.update')")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> revokePermission(
            @PathVariable UUID userId,
            @PathVariable UUID permissionId) {

        userPermissionRepository.deleteByUserIdAndPermissionId(userId, permissionId);
        return ResponseEntity.ok(ApiResponse.success("Permission revoked", null));
    }

    /**
     * PUT /user-page-access/{userId}/bulk
     * Full replacement — receives list of granted and denied permission IDs to assign directly.
     */
    @PutMapping("/{userId}/bulk")
    @PreAuthorize("hasRole('Admin') or hasAuthority('roles.update')")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> bulkSetPermissions(
            @PathVariable UUID userId,
            @RequestBody com.arrowdatatech.adt_production_report.role.dto.BulkPageAccessRequest req) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // Remove all existing direct overrides
        userPermissionRepository.deleteByUserId(userId);

        // Re-insert direct grants
        if (req.getGrantedIds() != null) {
            for (UUID permId : req.getGrantedIds()) {
                permissionRepository.findById(permId).ifPresent(perm -> {
                    UserPermission up = UserPermission.builder()
                            .user(user)
                            .permission(perm)
                            .isDenied(false)
                            .build();
                    userPermissionRepository.saveAndFlush(up);
                });
            }
        }

        // Re-insert direct denials
        if (req.getDeniedIds() != null) {
            for (UUID permId : req.getDeniedIds()) {
                permissionRepository.findById(permId).ifPresent(perm -> {
                    UserPermission up = UserPermission.builder()
                            .user(user)
                            .permission(perm)
                            .isDenied(true)
                            .build();
                    userPermissionRepository.saveAndFlush(up);
                });
            }
        }

        return ResponseEntity.ok(ApiResponse.success("User page access updated", null));
    }
}
