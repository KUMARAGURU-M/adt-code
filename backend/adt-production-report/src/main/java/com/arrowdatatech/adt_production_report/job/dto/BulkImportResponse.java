package com.arrowdatatech.adt_production_report.job.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class BulkImportResponse {

    private UUID batchId;
    private Integer totalRows;
    private Integer successfulRows;
    private Integer failedRows;
    private String status;
    private List<RowError> errors;

    @Getter
    @Builder
    public static class RowError {
        private Integer rowNumber;
        private String field;
        private String message;
    }
}