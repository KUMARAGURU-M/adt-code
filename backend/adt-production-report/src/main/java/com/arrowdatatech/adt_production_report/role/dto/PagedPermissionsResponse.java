package com.arrowdatatech.adt_production_report.role.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PagedPermissionsResponse {
    private List<PermissionDto> content;
    private int  pageNumber;
    private int  pageSize;
    private long totalElements;
    private int  totalPages;
    private boolean last;
}