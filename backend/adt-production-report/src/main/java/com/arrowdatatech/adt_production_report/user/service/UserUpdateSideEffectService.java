package com.arrowdatatech.adt_production_report.user.service;

import com.arrowdatatech.adt_production_report.attendance.repository.AttendanceEmployeeRepository;
import com.arrowdatatech.adt_production_report.auth.repository.UserSessionRepository;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserUpdateSideEffectService {

    private final UserSessionRepository sessionRepository;
    private final AttendanceEmployeeRepository attendanceEmployeeRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 3)
    public void revokeSessions(UUID userId) {
        sessionRepository.revokeAllByUserId(userId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 3)
    public void syncAttendanceEmployee(UUID userId,
                                       String fullName,
                                       Boolean isActive,
                                       boolean roleChanged,
                                       String roleName) {
        attendanceEmployeeRepository.findByUserId(userId).ifPresent(emp -> {
            boolean changed = false;
            if (fullName != null) {
                emp.setName(fullName.trim());
                changed = true;
            }
            if (isActive != null) {
                emp.setIsActive(isActive);
                changed = true;
            }
            if (roleChanged) {
                emp.setCategory(mapRoleToCategory(roleName));
                changed = true;
            }
            if (changed) {
                emp.setUpdatedAt(OffsetDateTime.now());
                attendanceEmployeeRepository.save(emp);
                log.info("Synchronized AttendanceEmployee updates for userId {}", userId);
            }
        });
    }

    private String mapRoleToCategory(String roleName) {
        if (roleName == null) return "Executive";
        switch (roleName.trim().toLowerCase()) {
            case "admin": return "Admin";
            case "manager": return "Manager";
            case "team leader": return "Team Leader";
            case "executive": return "Executive";
            default: return "Executive";
        }
    }
}
