package com.arrowdatatech.adt_production_report.tool.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.tool.dto.*;
import com.arrowdatatech.adt_production_report.tool.service.ToolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tools")
@RequiredArgsConstructor
public class ToolController {

    private final ToolService toolService;

    // GET /tools — list all active tools
    @GetMapping
    public ResponseEntity<ApiResponse<List<ToolDto>>> getAllTools() {
        return ResponseEntity.ok(ApiResponse.success(
                "Tools retrieved", toolService.getAllTools()));
    }

    // GET /tools/{toolId}/access
    // Returns all users with their access status for this tool
    @GetMapping("/{toolId}/access")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('tools.view')")
    public ResponseEntity<ApiResponse<List<ToolAccessDto>>> getToolAccess(
            @PathVariable UUID toolId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Tool access retrieved",
                toolService.getAllUsersForTool(toolId)));
    }

    // POST /tools/access — set access (Granted or Denied) for a user
    @PostMapping("/access")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('tools.manage')")
    public ResponseEntity<ApiResponse<ToolAccessDto>> setAccess(
            @RequestBody SetToolAccessRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Access updated", toolService.setAccess(request)));
    }

    // DELETE /tools/{toolId}/access/{userId}
    // Remove a user from the tool access list entirely
    @DeleteMapping("/{toolId}/access/{userId}")
    @PreAuthorize("hasAnyRole('Admin','Manager') or hasAuthority('tools.manage')")
    public ResponseEntity<ApiResponse<Void>> removeAccess(
            @PathVariable UUID toolId,
            @PathVariable UUID userId) {
        toolService.removeUserAccess(toolId, userId);
        return ResponseEntity.ok(
                ApiResponse.success("User removed from tool", null));
    }

    // GET /tools/my-access — what tools the current user can access
    @GetMapping("/my-access")
    public ResponseEntity<ApiResponse<List<String>>> getMyAccess() {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<String> tools = toolService.getAllTools().stream()
                .filter(t -> toolService.hasAccess(userId, t.getName()))
                .map(ToolDto::getName)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(
                ApiResponse.success("My tools retrieved", tools));
    }
}