package com.arrowdatatech.adt_production_report.common.audit.service;

import com.arrowdatatech.adt_production_report.common.audit.entity.ActivityLog;
import com.arrowdatatech.adt_production_report.common.audit.repository.ActivityLogRepository;
import com.arrowdatatech.adt_production_report.common.audit.dto.ActivityLogResponse;
import com.arrowdatatech.adt_production_report.common.audit.dto.PagedResponse;
import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    // Async so it never blocks the main request
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(User user, String action, String entityType,
                    UUID entityId, String entityLabel, String changes) {
        try {
            String ipAddress = extractIpAddress();
            String userAgent = extractUserAgent();

            ActivityLog log = ActivityLog.builder()
                    .user(user)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .entityLabel(entityLabel)
                    .changes(changes)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(log);
        } catch (Exception e) {
            // Never let logging failure break the main flow
            log.error("Failed to write activity log: {}", e.getMessage());
        }
    }

    // Convenience method for simple login/logout events
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLogin(User user) {
        log(user, "LOGIN", "employee",
                user.getId(), getFullName(user), null);
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLogout(User user) {
        log(user, "LOGOUT", "employee",
                user.getId(), getFullName(user), null);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ActivityLogResponse> getActivityLogs(UUID userId, String action, String entityType, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<ActivityLog> logsPage = activityLogRepository.filterActivityLogs(userId, action, entityType, pageable);

        java.util.List<ActivityLogResponse> content = logsPage.getContent().stream()
                .map(this::toResponse)
                .collect(java.util.stream.Collectors.toList());

        return PagedResponse.<ActivityLogResponse>builder()
                .content(content)
                .pageNumber(logsPage.getNumber())
                .pageSize(logsPage.getSize())
                .totalElements(logsPage.getTotalElements())
                .totalPages(logsPage.getTotalPages())
                .last(logsPage.isLast())
                .build();
    }

    private ActivityLogResponse toResponse(ActivityLog log) {
        String userName = log.getUser() != null ? getFullName(log.getUser()) : "System";
        return ActivityLogResponse.builder()
                .id(log.getId())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .userName(userName)
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .entityLabel(log.getEntityLabel())
                .changes(log.getChanges())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private String extractIpAddress() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder
                            .getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String forwarded = request.getHeader("X-Forwarded-For");
                if (forwarded != null && !forwarded.isEmpty()) {
                    return forwarded.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            log.warn("Could not extract IP: {}", e.getMessage());
        }
        return null;
    }

    private String extractUserAgent() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder
                            .getRequestAttributes();
            if (attrs != null) {
                return attrs.getRequest().getHeader("User-Agent");
            }
        } catch (Exception e) {
            log.warn("Could not extract User-Agent: {}", e.getMessage());
        }
        return null;
    }

    private String getFullName(User user) {
        if (user.getEmployeeProfile() != null) {
            return user.getEmployeeProfile().getFullName();
        }
        return user.getEmail();
    }
}