package com.arrowdatatech.adt_production_report.role.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.role.dto.*;
import com.arrowdatatech.adt_production_report.role.service.RolesPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RolesPermissionController {

    private final RolesPermissionService service;

    // ── Roles ──────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('roles.view')")
    public ResponseEntity<ApiResponse<List<RoleDto>>> getAllRoles(
            @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(ApiResponse.success(
                "Roles retrieved", service.getAllRoles(active)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('roles.view')")
    public ResponseEntity<ApiResponse<RoleDto>> getRole(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Role retrieved", service.getRoleById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('Admin') or hasAuthority('roles.create')")
    public ResponseEntity<ApiResponse<RoleDto>> createRole(
            @RequestBody CreateRoleRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Role created",
                        service.createRole(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('Admin') or hasAuthority('roles.update')")
    public ResponseEntity<ApiResponse<RoleDto>> updateRole(
            @PathVariable UUID id,
            @RequestBody CreateRoleRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Role updated",
                service.updateRole(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin') or hasAuthority('roles.delete')")
    public ResponseEntity<ApiResponse<Void>> deleteRole(
            @PathVariable UUID id) {
        service.deleteRole(id);
        return ResponseEntity.ok(
                ApiResponse.success("Role deleted", null));
    }

    // PUT /roles/{id}/permissions — assign permissions (full replacement)
    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasRole('Admin') or hasAuthority('roles.update')")
    public ResponseEntity<ApiResponse<RoleDto>> assignPermissions(
            @PathVariable UUID id,
            @RequestBody AssignPermissionsRequest req) {
        return ResponseEntity.ok(ApiResponse.success(
                "Permissions assigned",
                service.assignPermissions(id, req)));
    }

    // ── Permissions ────────────────────────────────────────────

    @GetMapping("/permissions")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('roles.view')")
    public ResponseEntity<ApiResponse<PagedPermissionsResponse>> getPermissions(
            @RequestParam(required = false) String resource,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                "Permissions retrieved",
                service.getPermissions(resource, page, size)));
    }

    @GetMapping("/permissions/all")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('roles.view')")
    public ResponseEntity<ApiResponse<List<PermissionDto>>>
    getAllPermissions() {
        return ResponseEntity.ok(ApiResponse.success(
                "Permissions retrieved", service.getAllPermissions()));
    }

    // POST /roles/permissions — bulk create (resource × action matrix)
    @PostMapping("/permissions")
    @PreAuthorize("hasRole('Admin') or hasAuthority('roles.create')")
    public ResponseEntity<ApiResponse<List<PermissionDto>>> createPermissions(
            @RequestBody CreatePermissionRequest req) {
        List<PermissionDto> created = service.createPermissions(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        created.size() + " permissions created", created));
    }

    @PutMapping("/permissions/{id}")
    @PreAuthorize("hasRole('Admin') or hasAuthority('roles.update')")
    public ResponseEntity<ApiResponse<PermissionDto>> updatePermission(
            @PathVariable UUID id,
            @RequestBody CreatePermissionRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Permission updated",
                service.updatePermission(id, req)));
    }

    @DeleteMapping("/permissions/{id}")
    @PreAuthorize("hasRole('Admin') or hasAuthority('roles.delete')")
    public ResponseEntity<ApiResponse<Void>> deletePermission(
            @PathVariable UUID id) {
        service.deletePermission(id);
        return ResponseEntity.ok(
                ApiResponse.success("Permission deleted", null));
    }
}