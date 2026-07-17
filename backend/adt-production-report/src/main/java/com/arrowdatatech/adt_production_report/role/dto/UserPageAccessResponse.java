package com.arrowdatatech.adt_production_report.role.dto;

import lombok.*;
import java.util.Set;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserPageAccessResponse {
    private Set<String> granted;
    private Set<String> denied;
}
