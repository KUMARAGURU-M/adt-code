package com.arrowdatatech.adt_production_report.leave.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class LeaveBalanceDto {
    private UUID       id;
    private UUID       userId;
    private String     employeeName;
    private UUID       leaveTypeId;
    private String     leaveTypeName;
    private Short      year;
    private BigDecimal totalAllocated;
    private BigDecimal used;
    private BigDecimal pending;
    private BigDecimal carriedForward;
    private BigDecimal available;
}