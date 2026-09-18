package com.arrowdatatech.adt_production_report.auth.service;

import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceEmployee;
import com.arrowdatatech.adt_production_report.attendance.repository.AttendanceEmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LoginAttendanceService {
    private final AttendanceEmployeeRepository employeeRepository;

    // Attendance is optional for authentication. Its failures must not roll back login.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void ensureEmployee(UUID userId, String fullName, List<String> roles) {
        if (employeeRepository.findByUserId(userId).isPresent()) return;

        String name = fullName.trim();
        List<AttendanceEmployee> matches = employeeRepository.searchEmployees(null, name)
                .stream()
                .filter(employee -> employee.getUserId() == null)
                .filter(employee -> name.equalsIgnoreCase(employee.getName().trim()))
                .toList();

        // Never take another user's record or guess between people with the same name.
        if (matches.size() == 1) {
            AttendanceEmployee employee = matches.get(0);
            employee.setUserId(userId);
            employee.setUpdatedAt(OffsetDateTime.now());
            employeeRepository.save(employee);
            return;
        }

        String category = roles.isEmpty() ? "Executive" : roles.get(0);
        if (!List.of("Admin", "Executive", "Team Leader", "Manager",
                "Senior Operator", "Operator", "Coordinator").contains(category)) {
            category = "Executive";
        }
        employeeRepository.save(AttendanceEmployee.builder()
                .userId(userId)
                .name(name)
                .category(category)
                .isActive(true)
                .sortOrder((int) employeeRepository.count() + 1)
                .updatedAt(OffsetDateTime.now())
                .build());
    }
}
