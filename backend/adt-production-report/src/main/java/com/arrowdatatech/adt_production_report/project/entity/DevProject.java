package com.arrowdatatech.adt_production_report.project.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dev_projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DevProject extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "technologies", length = 500)
    private String technologies;

    @Column(name = "repository_url", length = 500)
    private String repositoryUrl;

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "Active";
}
