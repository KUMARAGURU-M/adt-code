package com.arrowdatatech.adt_production_report.job.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class BulkImportRequest {

    @JsonProperty("projectId")
    private UUID projectId;

    // Each inner list = one row, each string = one cell value
    @JsonProperty("rows")
    private List<List<String>> rows;

    // Column order for this import
    // e.g. ["receiveDate","jobId","title","pageCount","isbn"]
    @JsonProperty("fieldOrder")
    private List<String> fieldOrder;
}