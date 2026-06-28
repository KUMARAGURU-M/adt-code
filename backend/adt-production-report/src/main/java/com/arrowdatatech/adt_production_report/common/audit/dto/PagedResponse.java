package com.arrowdatatech.adt_production_report.common.audit.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

// Generic paged response for all paginated endpoints
@Getter
@Builder
public class PagedResponse<T> {

    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean last;
}