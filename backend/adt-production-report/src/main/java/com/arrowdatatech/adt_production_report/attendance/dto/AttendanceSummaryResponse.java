package com.arrowdatatech.adt_production_report.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
public class AttendanceSummaryResponse {

    private UUID id;
    private UUID userId;
    private String fullName;
    private String role;
    private String gpayNumber;
    private LocalDate month;

    private Integer workingDays;
    private Integer presentDays;
    private Integer absentDays;
    private Integer halfDays;
    private Integer paidHolidays;
    private Integer weekOffs;
    private BigDecimal daysForWages;
    private BigDecimal baseSalary;
    private BigDecimal perDaySalary;
    private BigDecimal lossOfPay;
    private BigDecimal netSalary;
    private BigDecimal incentive;
    private BigDecimal advance;
    private BigDecimal totalSalary;
    private String salaryStatus;
    private Boolean isLocked;
}