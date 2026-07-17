package com.arrowdatatech.adt_production_report.hourlygraph.service;

import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.common.exception.UnauthorizedException;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.hourlygraph.dto.HourlyGraphDtos.*;
import com.arrowdatatech.adt_production_report.hourlygraph.entity.HourlyGraphSettings;
import com.arrowdatatech.adt_production_report.hourlygraph.entity.HourlyProductionLog;
import com.arrowdatatech.adt_production_report.hourlygraph.repository.HourlyGraphSettingsRepository;
import com.arrowdatatech.adt_production_report.hourlygraph.repository.HourlyProductionLogRepository;
import com.arrowdatatech.adt_production_report.shift.entity.Shift;
import com.arrowdatatech.adt_production_report.shift.repository.ShiftRepository;
import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceRecord;
import com.arrowdatatech.adt_production_report.attendance.repository.AttendanceRecordRepository;
import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceEmployee;
import com.arrowdatatech.adt_production_report.attendance.repository.AttendanceEmployeeRepository;
import com.arrowdatatech.adt_production_report.user.entity.EmployeeProfile;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HourlyGraphService {

    private final HourlyGraphSettingsRepository settingsRepository;
    private final HourlyProductionLogRepository logRepository;
    private final UserRepository userRepository;
    private final ShiftRepository shiftRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceEmployeeRepository attendanceEmployeeRepository;
    private final ObjectMapper objectMapper;

    private static final UUID SETTINGS_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    @Transactional(readOnly = true)
    public HourlyGraphSettingsResponse getSettings() {
        HourlyGraphSettings settings = settingsRepository.findById(SETTINGS_ID)
                .orElseGet(() -> {
                    // Seed standard empty/default values if missing
                    HourlyGraphSettings s = HourlyGraphSettings.builder()
                            .id(SETTINGS_ID)
                            .columnGroups("[]")
                            .targetRows("[]")
                            .build();
                    return settingsRepository.save(s);
                });

        try {
            Object columnGroups = objectMapper.readValue(settings.getColumnGroups(), Object.class);
            Object targetRows = objectMapper.readValue(settings.getTargetRows(), Object.class);
            return HourlyGraphSettingsResponse.builder()
                    .columnGroups(columnGroups)
                    .targetRows(targetRows)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse settings JSON", e);
            return HourlyGraphSettingsResponse.builder()
                    .columnGroups(new ArrayList<>())
                    .targetRows(new ArrayList<>())
                    .build();
        }
    }

    @Transactional
    public HourlyGraphSettingsResponse saveSettings(SaveSettingsRequest request) {
        HourlyGraphSettings settings = settingsRepository.findById(SETTINGS_ID)
                .orElse(HourlyGraphSettings.builder().id(SETTINGS_ID).build());

        try {
            settings.setColumnGroups(objectMapper.writeValueAsString(request.getColumnGroups()));
            settings.setTargetRows(objectMapper.writeValueAsString(request.getTargetRows()));
            HourlyGraphSettings saved = settingsRepository.save(settings);

            return HourlyGraphSettingsResponse.builder()
                    .columnGroups(objectMapper.readValue(saved.getColumnGroups(), Object.class))
                    .targetRows(objectMapper.readValue(saved.getTargetRows(), Object.class))
                    .build();
        } catch (Exception e) {
            log.error("Failed to serialize target settings", e);
            throw new BadRequestException("Invalid settings layout JSON data");
        }
    }

    @Transactional(readOnly = true)
    public HourlyGraphResponse getDailyLogs(LocalDate date) {
        // 1. Fetch saved logs
        List<HourlyProductionLog> savedLogs = logRepository.findByDateWithProfile(date);
        Map<UUID, HourlyProductionLog> savedLogsMap = savedLogs.stream()
                .filter(log -> log != null && log.getUser() != null)
                .collect(Collectors.toMap(log -> log.getUser().getId(), log -> log));

        // 2. Fetch all active users who are not Admin and have excludeFromHourlyGraph = false
        boolean requestingUserIsAdmin = SecurityUtils.isAdmin();
        List<User> activeUsers = userRepository.findByIsActiveTrueAndDeletedAtIsNull();
        List<User> eligibleUsers = activeUsers.stream()
                .filter(u -> {
                    // Admin gets to see everyone
                    if (requestingUserIsAdmin) {
                        return true;
                    }
                    // Non-admin only sees included users
                    EmployeeProfile profile = u.getEmployeeProfile();
                    return profile == null || !Boolean.TRUE.equals(profile.getExcludeFromHourlyGraph());
                })
                .collect(Collectors.toList());

        List<EmployeeRowDto> rows = new ArrayList<>();
        int index = 1;
        for (User user : eligibleUsers) {
            HourlyProductionLog savedLog = savedLogsMap.get(user.getId());
            EmployeeProfile profile = user.getEmployeeProfile();
            boolean isExcluded = profile != null && Boolean.TRUE.equals(profile.getExcludeFromHourlyGraph());

            // Fetch actual attendance check-in/out times dynamically from database
            String attInTime = "";
            String attOutTime = "";
            Optional<AttendanceEmployee> empOpt = attendanceEmployeeRepository.findByUserId(user.getId());
            if (empOpt.isPresent()) {
                Optional<AttendanceRecord> attOpt = attendanceRecordRepository.findByEmployeeIdAndAttendanceDate(empOpt.get().getId(), date);
                if (attOpt.isPresent()) {
                    AttendanceRecord att = attOpt.get();
                    if (att.getCheckInTime() != null) {
                        attInTime = att.getCheckInTime().atZoneSameInstant(java.time.ZoneId.of("Asia/Kolkata")).toLocalTime().toString().substring(0, 5); // HH:mm
                    }
                    if (att.getCheckOutTime() != null) {
                        attOutTime = att.getCheckOutTime().atZoneSameInstant(java.time.ZoneId.of("Asia/Kolkata")).toLocalTime().toString().substring(0, 5); // HH:mm
                    }
                }
            }

            EmployeeRowDto.EmployeeRowDtoBuilder builder = EmployeeRowDto.builder()
                    .userId(user.getId())
                    .name(profile != null ? profile.getFullName() : user.getUserCode())
                    .excluded(isExcluded)
                    .inTime(attInTime)
                    .outTime(attOutTime);

            if (savedLog != null) {
                builder.id("row-" + savedLog.getId().toString())
                        .shift(savedLog.getShiftName())
                        .project(savedLog.getProjectName() != null ? savedLog.getProjectName() : "")
                        .process(savedLog.getProcessName() != null ? savedLog.getProcessName() : "");
                try {
                    builder.hours(objectMapper.readValue(savedLog.getHours(), Object.class));
                } catch (Exception e) {
                    builder.hours(new ArrayList<>());
                }
            } else {
                // Populate default row details
                String defaultShiftName = user.getShiftAssignments().stream()
                        .filter(sa -> sa.getEffectiveTo() == null)
                        .map(sa -> sa.getShift().getName())
                        .findFirst()
                        .orElse("General Shift");

                builder.id("row-new-" + user.getId().toString())
                        .shift(defaultShiftName)
                        .project("")
                        .process("")
                        .hours(new ArrayList<>());
            }
            rows.add(builder.build());
        }

        // Sort by role priority first, then employee name alphabetically
        Map<UUID, Integer> rolePriorityMap = eligibleUsers.stream()
                .collect(Collectors.toMap(User::getId, this::getRolePriority));

        rows.sort((r1, r2) -> {
            int p1 = rolePriorityMap.getOrDefault(r1.getUserId(), 99);
            int p2 = rolePriorityMap.getOrDefault(r2.getUserId(), 99);
            if (p1 != p2) {
                return Integer.compare(p1, p2);
            }
            String name1 = r1.getName() != null ? r1.getName() : "";
            String name2 = r2.getName() != null ? r2.getName() : "";
            return name1.compareToIgnoreCase(name2);
        });

        // Get day of week name (e.g. Monday)
        String activeDay = date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        return HourlyGraphResponse.builder()
                .date(date)
                .activeDay(activeDay)
                .rows(rows)
                .build();
    }

    @Transactional
    public void saveDailyLogs(LocalDate date, SaveHourlyLogsRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        boolean isAdmin = SecurityUtils.isAdmin();
        boolean isManagerOrTL = SecurityUtils.hasRole("Manager") || SecurityUtils.hasRole("Team Leader");
        boolean canEditOthers = isAdmin || isManagerOrTL;

        for (EmployeeRowDto row : request.getRows()) {
            if (row.getUserId() == null) {
                throw new BadRequestException("userId is required for log rows");
            }

            // Employee row edit limit enforcement:
            // Non-privileged users can ONLY modify their own row.
            if (!canEditOthers && !row.getUserId().equals(currentUserId)) {
                log.warn("User {} attempted to modify hourly log for user {}", currentUserId, row.getUserId());
                // Skip or throw error. The requirement: "we need limit access to access other user row also".
                // We will throw UnauthorizedException.
                throw new UnauthorizedException("You are not authorized to modify logs for other employees.");
            }

            // Retrieve existing log to compare changes
            Optional<HourlyProductionLog> existingLogOpt = logRepository.findByDateAndUserId(date, row.getUserId());

            // Timing constraint checks:
            // Applicable only for non-privileged users.
            if (!canEditOthers) {
                // Cannot update logs for past/future days
                if (!date.equals(LocalDate.now())) {
                    throw new BadRequestException("You can only update hourly logs for the current date.");
                }

                validateTiming(row, existingLogOpt, date);
            }

            // Upsert the log
            HourlyProductionLog logEntity = existingLogOpt.orElseGet(() -> {
                User user = userRepository.findById(row.getUserId())
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + row.getUserId()));
                return HourlyProductionLog.builder()
                        .date(date)
                        .user(user)
                        .build();
            });

            logEntity.setShiftName(row.getShift());
            logEntity.setInTime(row.getInTime());
            logEntity.setOutTime(row.getOutTime());
            logEntity.setProjectName(row.getProject());
            logEntity.setProcessName(row.getProcess());
            try {
                logEntity.setHours(objectMapper.writeValueAsString(row.getHours()));
            } catch (Exception e) {
                throw new BadRequestException("Invalid hourly log details format");
            }

            logRepository.save(logEntity);
        }
    }

    @Transactional
    public void toggleEmployeeVisibility(UUID userId, boolean exclude) {
        User user = userRepository.findByIdWithProfile(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        EmployeeProfile profile = user.getEmployeeProfile();
        if (profile == null) {
            profile = EmployeeProfile.builder()
                    .user(user)
                    .fullName(user.getUserCode())
                    .timezone("Asia/Kolkata")
                    .excludeFromHourlyGraph(exclude)
                    .build();
            user.setEmployeeProfile(profile);
        } else {
            profile.setExcludeFromHourlyGraph(exclude);
        }

        userRepository.save(user);
        log.info("Visibility of user {} set to exclude={}", userId, exclude);
    }

    private String getHourField(List<Object> list, int index, String field) {
        if (list == null || index >= list.size()) {
            return "";
        }
        Object item = list.get(index);
        if (item == null) {
            return "";
        }
        if (item instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) item;
            Object val = map.get(field);
            return val != null ? val.toString() : "";
        }
        return "";
    }

    private void validateTiming(EmployeeRowDto incomingRow, Optional<HourlyProductionLog> existingLogOpt, LocalDate date) {
        try {
            // Parse incoming and existing hours
            List<Object> incomingHours = objectMapper.convertValue(incomingRow.getHours(),
                    new TypeReference<List<Object>>() {});
            List<Object> existingHours = new ArrayList<>();
            if (existingLogOpt.isPresent()) {
                existingHours = objectMapper.readValue(existingLogOpt.get().getHours(),
                        new TypeReference<List<Object>>() {});
            }

            // Find check-in time from Attendance record
            LocalTime checkInTime = null;
            Optional<AttendanceEmployee> empOpt = attendanceEmployeeRepository.findByUserId(incomingRow.getUserId());
            if (empOpt.isPresent()) {
                Optional<AttendanceRecord> attOpt = attendanceRecordRepository.findByEmployeeIdAndAttendanceDate(empOpt.get().getId(), date);
                if (attOpt.isPresent() && attOpt.get().getCheckInTime() != null) {
                    checkInTime = attOpt.get().getCheckInTime().atZoneSameInstant(java.time.ZoneId.of("Asia/Kolkata")).toLocalTime();
                }
            }

            if (checkInTime == null) {
                throw new BadRequestException("You must check in first before updating hourly logs.");
            }

            LocalTime now = LocalTime.now(java.time.ZoneId.of("Asia/Kolkata"));

            for (int i = 0; i < incomingHours.size(); i++) {
                String inVal = getHourField(incomingHours, i, "value");
                String inProc = getHourField(incomingHours, i, "process");
                String exVal = getHourField(existingHours, i, "value");
                String exProc = getHourField(existingHours, i, "process");

                // If values or process is modified, check the 10-minute active window
                if (!inVal.equals(exVal) || !inProc.equals(exProc)) {
                    // Window starts exactly (i+1) hours after check-in, preserving minutes.
                    // e.g. check-in 8:50 → 1st window: 9:50–10:00, not 9:00–9:10
                    LocalTime windowStart = checkInTime.plusHours((long)(i + 1));
                    LocalTime windowEnd   = windowStart.plusMinutes(10);

                    boolean isWithinWindow;
                    if (windowStart.isBefore(windowEnd)) {
                        isWithinWindow = !now.isBefore(windowStart) && !now.isAfter(windowEnd);
                    } else { // Midnight crossover
                        isWithinWindow = !now.isBefore(windowStart) || !now.isAfter(windowEnd);
                    }

                    if (!isWithinWindow) {
                        throw new BadRequestException("Hourly update for the " + ordinal(i + 1) +
                                " hour is only active for 10 minutes from " + windowStart.toString().substring(0, 5) +
                                " (allowed window: " + windowStart.toString().substring(0, 5) + " - " + windowEnd.toString().substring(0, 5) +
                                "). Active hour is relative to check-in time: " + checkInTime.toString().substring(0, 5) + ".");
                    }
                }
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error during timing validation", e);
            throw new BadRequestException("Failed to validate hourly update timing rules");
        }
    }

    private int getRolePriority(User user) {
        String role = user.getRoleAssignments().stream()
                .map(ura -> ura.getRole().getName())
                .collect(Collectors.joining(", "));
        if (role.isEmpty()) {
            role = "Employee";
        }
        String r = role.toLowerCase().trim();
        if (r.contains("admin")) return 1;
        if (r.contains("team leader")) return 2;
        if (r.contains("manager") || r.contains("management")) return 3;
        if (r.contains("employee")) return 4;
        return 5;
    }

    private String normalizeShiftName(String shiftName) {
        if (shiftName == null) return "General Shift";
        switch (shiftName.trim().toLowerCase()) {
            case "general":
            case "general shift":
                return "General Shift";
            case "morning":
            case "1st shift":
                return "1st Shift";
            case "evening":
            case "2nd shift":
                return "2nd Shift";
            case "night":
            case "night shift":
                return "Night Shift";
            default:
                return shiftName;
        }
    }

    private String ordinal(int n) {
        int j = n % 10, k = n % 100;
        if (j == 1 && k != 11) return n + "st";
        if (j == 2 && k != 12) return n + "nd";
        if (j == 3 && k != 13) return n + "rd";
        return n + "th";
    }
}
