package com.arrowdatatech.adt_production_report.role.service;

import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.role.dto.*;
import com.arrowdatatech.adt_production_report.role.entity.Permission;
import com.arrowdatatech.adt_production_report.role.entity.Role;
import com.arrowdatatech.adt_production_report.role.entity.RolePermission;
import com.arrowdatatech.adt_production_report.role.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RolesPermissionService {

    private final RoleRepository           roleRepository;
    private final PermissionRepository     permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    // ─────────────────────────────────────────────
    // ROLES — CRUD
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RoleDto> getAllRoles(Boolean active) {
        List<Role> roles = roleRepository.findAllFiltered(active);
        return roles.stream().map(this::toRoleDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoleDto getRoleById(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Role", "id", id));
        return toRoleDto(role);
    }

    @Transactional
    public RoleDto createRole(CreateRoleRequest req) {
        if (req.getName() == null || req.getName().isBlank())
            throw new BadRequestException("Role name is required.");
        if (roleRepository.existsByNameAndIsActiveTrue(req.getName().trim()))
            throw new BadRequestException(
                    "Role '" + req.getName() + "' already exists.");

        Role role = Role.builder()
                .name(req.getName().trim())
                .description(req.getDescription())
                .isActive(req.getIsActive() == null || req.getIsActive())
                .updatedAt(OffsetDateTime.now())
                .build();

        role = roleRepository.save(role);
        log.info("Role created: {}", role.getName());
        return toRoleDto(role);
    }

    @Transactional
    public RoleDto updateRole(UUID id, CreateRoleRequest req) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Role", "id", id));

        if (req.getName() != null && !req.getName().isBlank())
            role.setName(req.getName().trim());
        if (req.getDescription() != null)
            role.setDescription(req.getDescription());
        if (req.getIsActive() != null)
            role.setIsActive(req.getIsActive());
        role.setUpdatedAt(OffsetDateTime.now());

        return toRoleDto(roleRepository.save(role));
    }

    @Transactional
    public void deleteRole(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Role", "id", id));
        // Remove all role_permission rows
        rolePermissionRepository.deleteByRoleId(id);
        roleRepository.deleteById(id);
        log.info("Role deleted: {}", role.getName());
    }

    // ─────────────────────────────────────────────
    // ASSIGN PERMISSIONS TO ROLE (full replacement)
    // ─────────────────────────────────────────────

    @Transactional
    public RoleDto assignPermissions(UUID roleId,
                                     AssignPermissionsRequest req) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Role", "id", roleId));

        // Delete all current assignments
        rolePermissionRepository.deleteByRoleId(roleId);

        // Re-create with the new list
        if (req.getPermissionIds() != null) {
            for (UUID permId : req.getPermissionIds()) {
                Permission perm = permissionRepository.findById(permId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Permission", "id", permId));
                RolePermission rp = RolePermission.builder()
                        .role(role)
                        .permission(perm)
                        .build();
                rolePermissionRepository.save(rp);
            }
        }

        log.info("Permissions assigned to role {}: {} permissions",
                role.getName(),
                req.getPermissionIds() != null
                        ? req.getPermissionIds().size() : 0);

        return toRoleDto(role);
    }

    // ─────────────────────────────────────────────
    // PERMISSIONS — CRUD
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PagedPermissionsResponse getPermissions(
            String resource, int page, int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Permission> result = permissionRepository
                .findByResource(
                        (resource != null && !resource.isBlank())
                                ? resource : null,
                        pageable);

        return PagedPermissionsResponse.builder()
                .content(result.getContent().stream()
                        .map(this::toPermDto)
                        .collect(Collectors.toList()))
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public List<PermissionDto> getAllPermissions() {
        return permissionRepository.findByIsActiveTrueOrderByCodeAsc()
                .stream().map(this::toPermDto)
                .collect(Collectors.toList());
    }

    // Bulk create: resources × actions matrix
    @Transactional
    public List<PermissionDto> createPermissions(
            CreatePermissionRequest req) {

        if (req.getResources() == null || req.getResources().isEmpty())
            throw new BadRequestException("At least one resource is required.");
        if (req.getActions() == null || req.getActions().isEmpty())
            throw new BadRequestException("At least one action is required.");

        List<PermissionDto> created = new ArrayList<>();

        for (String resource : req.getResources()) {
            for (String action : req.getActions()) {
                String name = resource + "." + action;

                // Skip if already exists
                if (permissionRepository.existsByCode(name)) {
                    log.warn("Permission '{}' already exists — skipped", name);
                    continue;
                }

                Permission perm = Permission.builder()
                        .code(name)
                        .resource(resource.toLowerCase().trim())
                        .action(action.toLowerCase().trim())
                        .description(req.getDescription() != null
                                ? req.getDescription()
                                : action + " " + resource)
                        .isActive(req.getIsActive() == null
                                || req.getIsActive())
                        .updatedAt(OffsetDateTime.now())
                        .build();

                created.add(toPermDto(permissionRepository.save(perm)));
                log.info("Permission created: {}", name);
            }
        }

        return created;
    }

    @Transactional
    public PermissionDto updatePermission(UUID id,
                                          CreatePermissionRequest req) {
        Permission perm = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Permission", "id", id));

        if (req.getDescription() != null)
            perm.setDescription(req.getDescription());
        if (req.getIsActive() != null)
            perm.setIsActive(req.getIsActive());
        perm.setUpdatedAt(OffsetDateTime.now());

        return toPermDto(permissionRepository.save(perm));
    }

    @Transactional
    public void deletePermission(UUID id) {
        Permission perm = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Permission", "id", id));
        perm.setIsActive(false);
        perm.setUpdatedAt(OffsetDateTime.now());
        permissionRepository.save(perm);
        log.info("Permission soft-deleted: {}", perm.getCode());
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────

    private RoleDto toRoleDto(Role role) {
        List<UUID> permIds = rolePermissionRepository
                .findPermissionIdsByRoleId(role.getId());
        return RoleDto.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .isActive(role.getIsActive())
                .createdAt(role.getCreatedAt())
                .permissionIds(permIds)
                .build();
    }

    private PermissionDto toPermDto(Permission p) {
        return PermissionDto.builder()
                .id(p.getId())
                .name(p.getCode())
                .description(p.getDescription())
                .resource(p.getResource())
                .action(p.getAction())
                .isActive(p.getIsActive())
                .createdAt(p.getCreatedAt())
                .build();
    }
}