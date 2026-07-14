package com.arrowdatatech.adt_production_report.hourlygraph.scheduler;

import com.arrowdatatech.adt_production_report.notification.entity.Notification;
import com.arrowdatatech.adt_production_report.notification.repository.NotificationRepository;
import com.arrowdatatech.adt_production_report.user.entity.EmployeeProfile;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class HourlyNotificationScheduler {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    // Runs every hour on the hour (e.g. 10:00, 11:00, etc.)
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void sendHourlyReminder() {
        log.info("Hourly production log reminder scheduler started.");

        // 1. Fetch all active executives
        List<User> employees = userRepository.findByRoleName("Executive");

        // 2. Filter out employees who are hidden/excluded from Hourly Graph
        List<User> eligibleEmployees = employees.stream()
                .filter(u -> {
                    EmployeeProfile profile = u.getEmployeeProfile();
                    return profile == null || !Boolean.TRUE.equals(profile.getExcludeFromHourlyGraph());
                })
                .collect(Collectors.toList());

        log.info("Sending hourly log reminders to {} employees.", eligibleEmployees.size());

        // 3. Create notifications
        for (User emp : eligibleEmployees) {
            Notification notification = Notification.builder()
                    .user(emp)
                    .title("Hourly Update Reminder")
                    .message("Please enter your hourly production update for this hour.")
                    .type("GENERAL")
                    .isRead(false)
                    .createdAt(OffsetDateTime.now())
                    .build();

            notificationRepository.save(notification);
        }

        log.info("Hourly production log reminder notifications created successfully.");
    }
}








