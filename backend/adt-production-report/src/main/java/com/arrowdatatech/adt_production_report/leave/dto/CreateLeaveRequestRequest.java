package com.arrowdatatech.adt_production_report.leave.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor
public class CreateLeaveRequestRequest {
    @JsonProperty("userId")       private UUID      userId;
    @JsonProperty("leaveTypeId")  private UUID      leaveTypeId;
    @JsonProperty("approverId")   private UUID      approverId;
    @JsonProperty("startDate")    private LocalDate startDate;
    @JsonProperty("endDate")      private LocalDate endDate;
    @JsonProperty("reason")       private String    reason;
    @JsonProperty("status")       private String    status;
    @JsonProperty("adminNote")    private String    adminNote;
}