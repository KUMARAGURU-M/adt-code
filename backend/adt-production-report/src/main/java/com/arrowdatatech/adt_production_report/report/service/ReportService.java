package com.arrowdatatech.adt_production_report.report.service;

import com.arrowdatatech.adt_production_report.workwise.dto.TimeLogResponse;
import com.arrowdatatech.adt_production_report.workwise.service.WorkwiseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final WorkwiseService workwiseService;

    @Transactional(readOnly = true)
    public List<TimeLogResponse> getReportLogs(UUID userId, UUID projectId, String status, LocalDate startDate, LocalDate endDate) {
        return workwiseService.getAdminTimeLogs(userId, projectId, null, status, startDate, endDate);
    }
}
