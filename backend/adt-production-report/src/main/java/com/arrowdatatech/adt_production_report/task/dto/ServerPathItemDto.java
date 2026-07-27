package com.arrowdatatech.adt_production_report.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServerPathItemDto {
    private String name;
    private String path;
    private boolean isDirectory;
    private long sizeBytes;
    private long lastModified;
}


