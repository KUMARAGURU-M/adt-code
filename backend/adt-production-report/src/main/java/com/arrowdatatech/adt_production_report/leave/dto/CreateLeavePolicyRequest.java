package com.arrowdatatech.adt_production_report.leave.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter @Setter @NoArgsConstructor
public class CreateLeavePolicyRequest {
    @JsonProperty("name")               private String  name;
    @JsonProperty("description")        private String  description;
    @JsonProperty("defaultAnnualDays")  private Integer defaultAnnualDays;
    @JsonProperty("probationDays")      private Integer probationDays;
    @JsonProperty("yearStartMonth")     private String  yearStartMonth;
    @JsonProperty("yearStartDay")       private Short   yearStartDay;
}