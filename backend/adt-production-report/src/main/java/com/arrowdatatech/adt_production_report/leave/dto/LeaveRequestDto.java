package com.arrowdatatech.adt_production_report.leave.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class LeaveRequestDto {
    private UUID       id;
    private UUID       userId;
    private String     employeeName;
    private UUID       leaveTypeId;
    private String     leaveTypeName;
    private String     leaveTypeCode;
    private UUID       approverId;
    private String     approverName;
    private LocalDate  startDate;
    private LocalDate  endDate;
    private BigDecimal days;
    private String     reason;
    private String     status;
    private String     adminNote;
    private OffsetDateTime appliedAt;
    private OffsetDateTime reviewedAt;
}