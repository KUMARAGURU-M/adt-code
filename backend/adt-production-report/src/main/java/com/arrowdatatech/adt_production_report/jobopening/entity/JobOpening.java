package com.arrowdatatech.adt_production_report.jobopening.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "job_openings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobOpening extends BaseEntity {

    @Column(name = "title", nullable = false, length = 300)
    private String title;

    @Column(name = "department", nullable = false, length = 200)
    private String department;

    @Column(name = "location", nullable = false, length = 200)
    private String location;

    @Column(name = "job_type", nullable = false, length = 50)
    @Builder.Default
    private String jobType = "Full-Time";

    @Column(name = "experience", length = 100)
    private String experience;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "tags", columnDefinition = "TEXT")
    private String tags;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
