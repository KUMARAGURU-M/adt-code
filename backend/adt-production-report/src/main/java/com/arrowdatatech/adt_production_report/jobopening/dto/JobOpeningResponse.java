package com.arrowdatatech.adt_production_report.jobopening.dto;

import com.arrowdatatech.adt_production_report.jobopening.entity.JobOpening;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Data
public class JobOpeningResponse {
    private UUID id;
    private String title;
    private String department;
    private String location;
    private String jobType;
    private String experience;
    private String description;
    private List<String> tags;
    private boolean active;
    private OffsetDateTime createdAt;

    public static JobOpeningResponse from(JobOpening e) {
        JobOpeningResponse r = new JobOpeningResponse();
        r.setId(e.getId());
        r.setTitle(e.getTitle());
        r.setDepartment(e.getDepartment());
        r.setLocation(e.getLocation());
        r.setJobType(e.getJobType());
        r.setExperience(e.getExperience());
        r.setDescription(e.getDescription());
        r.setActive(e.isActive());
        r.setCreatedAt(e.getCreatedAt());
        // Tags stored as comma-separated string
        if (e.getTags() != null && !e.getTags().isBlank()) {
            r.setTags(Arrays.stream(e.getTags().split(","))
                    .map(String::trim).filter(s -> !s.isEmpty()).toList());
        } else {
            r.setTags(List.of());
        }
        return r;
    }
}
