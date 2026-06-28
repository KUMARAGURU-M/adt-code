package com.arrowdatatech.adt_production_report.leave.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class LeavePolicyDto {
    private UUID   id;
    private String name;
    private String description;
    private Integer defaultAnnualDays;
    private Integer probationDays;
    private String  yearStartMonth;
    private Short   yearStartDay;
    private Boolean isActive;
    private OffsetDateTime createdAt;
}