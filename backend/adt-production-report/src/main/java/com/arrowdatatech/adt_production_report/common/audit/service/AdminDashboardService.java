package com.arrowdatatech.adt_production_report.common.audit.service;

import com.arrowdatatech.adt_production_report.attendance.repository.AttendanceRecordRepository;
import com.arrowdatatech.adt_production_report.common.audit.dto.AdminDashboardResponse;
import com.arrowdatatech.adt_production_report.project.repository.ProjectRepository;
import com.arrowdatatech.adt_production_report.task.repository.TaskRepository;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import com.arrowdatatech.adt_production_report.workwise.repository.TimeLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TimeLogRepository timeLogRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboardStats() {
        LocalDate today = LocalDate.now();

        long totalUsers = userRepository.countTotalUsers();
        long activeUsers = userRepository.countActiveUsers();
        long totalProjects = projectRepository.countTotalProjects();
        long activeProjects = projectRepository.countActiveProjects();
        long totalTasks = taskRepository.countTotalTasks();
        long workingSeconds = timeLogRepository.sumTotalWorkingSeconds();

        // Round working seconds to hours (1 decimal place)
        double totalHoursLogged = Math.round((workingSeconds / 3600.0) * 10.0) / 10.0;

        long activeEmployeesToday = attendanceRecordRepository.countActiveEmployeesOnDate(today);
        long tasksCompletedToday = timeLogRepository.countTasksCompletedOnDate(today);

        return AdminDashboardResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .totalTasks(totalTasks)
                .totalHoursLogged(totalHoursLogged)
                .activeEmployeesToday(activeEmployeesToday)
                .tasksCompletedToday(tasksCompletedToday)
                .build();
    }
}
