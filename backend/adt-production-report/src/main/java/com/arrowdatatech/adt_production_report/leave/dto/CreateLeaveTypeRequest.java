package com.arrowdatatech.adt_production_report.leave.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter @Setter @NoArgsConstructor
public class CreateLeaveTypeRequest {
    @JsonProperty("code") private String  code;
    @JsonProperty("name") private String  name;
    @JsonProperty("description") private String  description;
    @JsonProperty("maxDaysPerYear") private Integer maxDaysPerYear;
    @JsonProperty("carryForward") private Boolean carryForward;
    @JsonProperty("requiresApproval") private Boolean requiresApproval;
}