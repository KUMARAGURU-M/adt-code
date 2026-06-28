package com.arrowdatatech.adt_production_report.tool.service;

import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.tool.dto.*;
import com.arrowdatatech.adt_production_report.tool.entity.Tool;
import com.arrowdatatech.adt_production_report.tool.entity.ToolAccess;
import com.arrowdatatech.adt_production_report.tool.repository.ToolAccessRepository;
import com.arrowdatatech.adt_production_report.tool.repository.ToolRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ToolService {

    private final ToolRepository       toolRepository;
    private final ToolAccessRepository accessRepository;
    private final UserRepository       userRepository;

    // ─────────────────────────────────────────────
    // GET ALL TOOLS
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ToolDto> getAllTools() {
        return toolRepository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(t -> ToolDto.builder()
                        .id(t.getId()).name(t.getName())
                        .description(t.getDescription())
                        .toolUrl(t.getToolUrl())
                        .isActive(t.getIsActive())
                        .build())
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET TOOL WITH ALL USER ACCESS ENTRIES
    // Used by: Tools page table (one call per tab)
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ToolWithAccessResponse getToolWithAccess(UUID toolId) {
        Tool tool = toolRepository.findById(toolId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tool", "id", toolId));

        List<ToolAccessDto> accessList =
                accessRepository.findByToolIdOrderByUserIdAsc(toolId)
                        .stream()
                        .map(ta -> toAccessDto(ta))
                        .collect(Collectors.toList());

        return ToolWithAccessResponse.builder()
                .toolId(tool.getId())
                .toolName(tool.getName())
                .description(tool.getDescription())
                .accessList(accessList)
                .build();
    }

    // ─────────────────────────────────────────────
    // GET ALL USERS WITH ACCESS STATUS FOR A TOOL
    // Returns ALL active users, each with Granted/Denied
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ToolAccessDto> getAllUsersForTool(UUID toolId) {
        Tool tool = toolRepository.findById(toolId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tool", "id", toolId));

        // Load all existing access rows for this tool
        List<ToolAccess> existingAccess =
                accessRepository.findByToolIdOrderByUserIdAsc(toolId);

        // Map userId -> access
        java.util.Map<UUID, ToolAccess> accessMap = existingAccess.stream()
                .collect(java.util.stream.Collectors.toMap(
                        ta -> ta.getUser().getId(),
                        ta -> ta
                ));

        // Get all active users
        List<User> allUsers = userRepository.findAll().stream()
                .filter(u -> u.getDeletedAt() == null)
                .collect(Collectors.toList());

        return allUsers.stream().map(user -> {
            ToolAccess ta = accessMap.get(user.getId());
            String fullName = user.getEmployeeProfile() != null
                    ? user.getEmployeeProfile().getFullName()
                    : user.getEmail();
            String role = getUserRole(user);

            if (ta != null) {
                return toAccessDto(ta);
            } else {
                // No row yet — show as Denied
                return ToolAccessDto.builder()
                        .id(null)
                        .toolId(toolId)
                        .toolName(tool.getName())
                        .userId(user.getId())
                        .employeeName(fullName)
                        .email(user.getEmail())
                        .role(role)
                        .access("Denied")
                        .build();
            }
        }).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // SET ACCESS FOR A USER ON A TOOL (upsert)
    // Toggles between Granted and Denied
    // ─────────────────────────────────────────────
    @Transactional
    public ToolAccessDto setAccess(SetToolAccessRequest request) {
        if (request.getToolId() == null)
            throw new BadRequestException("toolId is required.");
        if (request.getUserId() == null)
            throw new BadRequestException("userId is required.");
        if (!"Granted".equals(request.getAccess())
                && !"Denied".equals(request.getAccess()))
            throw new BadRequestException(
                    "access must be 'Granted' or 'Denied'.");

        Tool tool = toolRepository.findById(request.getToolId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tool", "id", request.getToolId()));

        User user = userRepository.findByIdWithProfile(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User", "id", request.getUserId()));

        // Get granter
        User grantedBy = null;
        try {
            UUID currentId = SecurityUtils.getCurrentUserId();
            grantedBy = userRepository.findByIdWithProfile(currentId)
                    .orElse(null);
        } catch (Exception ignored) {}

        ToolAccess ta = accessRepository
                .findByToolIdAndUserId(tool.getId(), user.getId())
                .orElse(null);

        if (ta == null) {
            ta = ToolAccess.builder()
                    .tool(tool)
                    .user(user)
                    .access(request.getAccess())
                    .grantedBy(grantedBy)
                    .updatedAt(OffsetDateTime.now())
                    .build();
        } else {
            ta.setAccess(request.getAccess());
            ta.setGrantedBy(grantedBy);
            ta.setUpdatedAt(OffsetDateTime.now());
        }

        ta = accessRepository.save(ta);

        log.info("Tool access set: user={} tool={} access={}",
                user.getId(), tool.getName(), request.getAccess());

        return toAccessDto(ta);
    }

    // ─────────────────────────────────────────────
    // REMOVE USER FROM TOOL ACCESS LIST
    // Deletes the tool_access row entirely
    // ─────────────────────────────────────────────
    @Transactional
    public void removeUserAccess(UUID toolId, UUID userId) {
        accessRepository.findByToolIdAndUserId(toolId, userId)
                .ifPresent(ta -> {
                    accessRepository.deleteById(ta.getId());
                    log.info("Tool access removed: user={} tool={}",
                            userId, toolId);
                });
    }

    // ─────────────────────────────────────────────
    // CHECK ACCESS — used by middleware/other services
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public boolean hasAccess(UUID userId, String toolName) {
        return accessRepository.hasAccessToTool(userId, toolName);
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────

    private ToolAccessDto toAccessDto(ToolAccess ta) {
        User user = ta.getUser();
        String fullName = user.getEmployeeProfile() != null
                ? user.getEmployeeProfile().getFullName()
                : user.getEmail();
        String role = getUserRole(user);

        String grantedByName = null;
        if (ta.getGrantedBy() != null) {
            grantedByName = ta.getGrantedBy().getEmployeeProfile() != null
                    ? ta.getGrantedBy().getEmployeeProfile().getFullName()
                    : ta.getGrantedBy().getEmail();
        }

        return ToolAccessDto.builder()
                .id(ta.getId())
                .toolId(ta.getTool().getId())
                .toolName(ta.getTool().getName())
                .userId(user.getId())
                .employeeName(fullName)
                .email(user.getEmail())
                .role(role)
                .access(ta.getAccess())
                .grantedById(ta.getGrantedBy() != null
                        ? ta.getGrantedBy().getId() : null)
                .grantedByName(grantedByName)
                .updatedAt(ta.getUpdatedAt())
                .build();
    }

    private String getUserRole(User user) {
        // Get primary role from user_role_assignments
        return user.getRoleAssignments() != null
                && !user.getRoleAssignments().isEmpty()
                ? user.getRoleAssignments().iterator().next()
                .getRole().getName()
                : "Employee";
    }
}