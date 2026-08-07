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
public class BulkDeleteRequest {

    @JsonProperty("ids")
    private List<UUID> ids;
}
