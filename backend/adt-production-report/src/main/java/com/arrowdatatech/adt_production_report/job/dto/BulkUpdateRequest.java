package com.arrowdatatech.adt_production_report.job.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Request body for PUT /jobs/bulk-update.
 * Selectively applies updates to a list of job IDs.
 */
@Getter
@Setter
@NoArgsConstructor
public class BulkUpdateRequest {

    /** The UUIDs of the jobs to update. */
    @JsonProperty("ids")
    private List<UUID> ids;

    /**
     * Map of field → value to apply to every selected job.
     * Supported keys: pdfInputType, complexity, referenceType,
     *                 status, fileStatus, uploadDate, billingStatus.
     */
    @JsonProperty("updates")
    private Map<String, String> updates;
}
