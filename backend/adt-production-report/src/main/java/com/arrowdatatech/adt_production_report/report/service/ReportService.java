package com.arrowdatatech.adt_production_report.report.service;

import com.arrowdatatech.adt_production_report.report.dto.DevProductivityReportResponse;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import com.arrowdatatech.adt_production_report.task.repository.DevTaskRepository;
import com.arrowdatatech.adt_production_report.correction.repository.DevCorrectionRepository;
import com.arrowdatatech.adt_production_report.workwise.repository.TimeLogRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.task.entity.DevTask;
import com.arrowdatatech.adt_production_report.correction.entity.DevCorrection;
import com.arrowdatatech.adt_production_report.workwise.dto.TimeLogResponse;
import com.arrowdatatech.adt_production_report.workwise.service.WorkwiseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final WorkwiseService workwiseService;
    private final UserRepository userRepository;
    private final DevTaskRepository devTaskRepository;
    private final DevCorrectionRepository devCorrectionRepository;
    private final TimeLogRepository timeLogRepository;

    @Transactional(readOnly = true)
    public List<TimeLogResponse> getReportLogs(UUID userId, UUID projectId, String status, LocalDate startDate, LocalDate endDate) {
        return workwiseService.getAdminTimeLogs(userId, projectId, null, status, startDate, endDate);
    }

    @Transactional(readOnly = true)
    public DevProductivityReportResponse getDevProductivityReport() {
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        LocalDate endOfWeek = today.with(java.time.temporal.TemporalAdjusters.nextOrSame(java.time.DayOfWeek.SUNDAY));

        List<User> activeUsers = userRepository.findAllNonDeleted().stream()
                .filter(u -> u.getIsActive() != null && u.getIsActive())
                .collect(Collectors.toList());

        List<DevProductivityReportResponse.DevEmployeeReport> employeeReports = new ArrayList<>();
        long totalSecondsThisWeek = 0;

        for (User user : activeUsers) {
            String roleName = "Developer";
            if (user.getRoleAssignments() != null && !user.getRoleAssignments().isEmpty()) {
                roleName = user.getRoleAssignments().iterator().next().getRole().getName();
            }

            List<DevTask> userTasks = devTaskRepository.findByAssignedToId(user.getId());
            
            String primaryProject = "General";
            if (!userTasks.isEmpty()) {
                Map<String, Long> projectCounts = userTasks.stream()
                        .filter(t -> t.getProject() != null)
                        .collect(Collectors.groupingBy(t -> t.getProject().getName(), Collectors.counting()));
                primaryProject = projectCounts.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse("General");
            }

            long workingSeconds = timeLogRepository.findByUserIdAndLogDateBetween(user.getId(), startOfWeek, endOfWeek)
                    .stream()
                    .mapToLong(tl -> tl.getWorkingSeconds() != null ? tl.getWorkingSeconds() : 0)
                    .sum();

            totalSecondsThisWeek += workingSeconds;

            double hours = workingSeconds / 3600.0;
            String hoursStr = String.format("%.1f hrs", hours);

            String name = user.getEmployeeProfile() != null ? user.getEmployeeProfile().getFullName() : user.getUserCode();
            String status = user.getEmployeeProfile() != null ? user.getEmployeeProfile().getEmployeeStatus() : "Active";
            if (status == null || status.isBlank()) {
                status = "Active";
            }

            employeeReports.add(DevProductivityReportResponse.DevEmployeeReport.builder()
                    .id(user.getId())
                    .name(name)
                    .role(roleName)
                    .project(primaryProject)
                    .hoursThisWeek(hoursStr)
                    .status(status)
                    .build());
        }

        List<DevTask> allTasks = devTaskRepository.findAll();
        long totalTasks = allTasks.size();
        long completedTasks = allTasks.stream()
                .filter(t -> "Completed".equalsIgnoreCase(t.getStatus()))
                .count();

        double completionPercentage = totalTasks > 0 ? (completedTasks * 100.0) / totalTasks : 0.0;
        String overallCompletion = String.format("%.1f%%", completionPercentage);

        long completedOrReviewTasks = allTasks.stream()
                .filter(t -> "Completed".equalsIgnoreCase(t.getStatus()) || "Review".equalsIgnoreCase(t.getStatus()))
                .count();
        double efficiencyVal = totalTasks > 0 ? (completedOrReviewTasks * 100.0) / totalTasks : 0.0;
        String efficiency = String.format("%.1f%%", efficiencyVal);

        double totalHoursVal = totalSecondsThisWeek / 3600.0;
        String totalHoursStr = String.format("%.1f hrs", totalHoursVal);

        List<DevCorrection> allCorrections = devCorrectionRepository.findAll();
        long resolvedCorrections = allCorrections.stream()
                .filter(c -> "Resolved".equalsIgnoreCase(c.getStatus()) || "Completed".equalsIgnoreCase(c.getStatus()))
                .count();

        DevProductivityReportResponse.DevProductivityAnalytics analytics = DevProductivityReportResponse.DevProductivityAnalytics.builder()
                .overallCompletion(overallCompletion)
                .efficiency(efficiency)
                .totalHours(totalHoursStr)
                .correctionsResolved((int) resolvedCorrections)
                .build();

        return DevProductivityReportResponse.builder()
                .employees(employeeReports)
                .analytics(analytics)
                .build();
    }
}
