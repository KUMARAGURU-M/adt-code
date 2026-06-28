package com.arrowdatatech.adt_production_report.common.audit.controller;

import com.arrowdatatech.adt_production_report.common.audit.dto.ActivityLogResponse;
import com.arrowdatatech.adt_production_report.common.audit.dto.PagedResponse;
import com.arrowdatatech.adt_production_report.common.audit.service.ActivityLogService;
import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/activity-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('Admin','Manager')")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ActivityLogResponse>>> getActivityLogs(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        UUID targetUserId = (userId != null && !userId.isBlank() && !"All".equalsIgnoreCase(userId)) 
                ? UUID.fromString(userId) : null;
        String targetAction = (action != null && !action.isBlank() && !"All".equalsIgnoreCase(action)) 
                ? action : null;
        String targetEntityType = (entityType != null && !entityType.isBlank() && !"All".equalsIgnoreCase(entityType)) 
                ? entityType : null;

        PagedResponse<ActivityLogResponse> result = activityLogService.getActivityLogs(
                targetUserId, targetAction, targetEntityType, page, size);

        return ResponseEntity.ok(ApiResponse.success("Activity logs retrieved", result));
    }
}
