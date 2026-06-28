package com.arrowdatatech.adt_production_report.leave.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter @Setter @NoArgsConstructor
public class ReviewLeaveRequest {
    // Approved | Rejected | Cancelled
    @JsonProperty("status")    private String status;
    @JsonProperty("adminNote") private String adminNote;
}